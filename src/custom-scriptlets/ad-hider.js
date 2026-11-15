/*******************************************************************************

    uBlock Origin Lite - a comprehensive, MV3-compliant content blocker
    Copyright (C) 2026-present Raymond Hill

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

    Home: https://github.com/gorhill/uBlock

*/

// ad-hider.js
//
// Hides advertising blocks that the generic cosmetic filters cannot catch,
// without having to write one rule per website.
//
// Detection is based on three independent signals, in order of confidence:
//
//  1. Standard sponsored-link markup. The `rel="sponsored"` token is the
//     Google/FTC standard way of marking paid links, and `data-s` with an
//     ad-ish value is what several ad-serving scripts use. This is
//     semantics, not guesswork, so it is safe to act on it.
//  2. Container names that are unambiguous about being an ad slot
//     (`bt-ads`, `ads-rot`, `bannerrow`, `ad-container`, ...).
//  3. Very generic container names (`ad`, `ads`, `banner`, ...) which are only
//     honoured when the element is clearly an ad slot: no meaningful text,
//     no media, no form, and not a structural element of the page.
//
// Everything is applied with a MutationObserver because most ad slots are
// injected after the initial parse.

import { registerScriptlet } from './base.js';

export function adHiderFn() {
    'use strict';

    if ( window.__ubolAdHiderActive === true ) { return; }
    window.__ubolAdHiderActive = true;

    const hidden = new WeakSet();

    // Container names that mean "advertising slot" with no ambiguity.
    const STRONG_IDS = new Set([
        'bt-ads', 'bt-ads-mini', 'bt-ads-mini2', 'ads-rot', 'adst',
        'ad-container', 'ads-container', 'ad-slot', 'ad-slot-container',
        'ad-banner', 'banner-ad', 'ad-placement', 'ad-unit', 'dfp-ad',
        'google_ads_container', 'ads-rotation', 'ad-rotation', 'ad-overlay',
        'ads-overlay', 'advert-container', 'ad-wrapper', 'ad-holder', 'ad-box',
        'adsbox', 'adslot', 'ad-frame', 'ad-vert', 'adzone', 'adsbygoogle',
        'header-ads', 'widget-banner', 'grid-banner', 'bannerrow',
        'adsnon-float', 'adsplayer', 'adFallback', 'adVideo', 'adLink',
    ]);

    // Container names that are only meaningful in combination with a class.
    const STRONG_CLASSES = new Set([
        'ad-container', 'ad-slot', 'ad-wrapper', 'ad-unit', 'ad-placement',
        'ad-holder', 'ad-box', 'adsbox', 'adslot', 'ads-container',
        'ad-container-ads', 'ad-inner', 'ad-frame', 'ad-vert', 'adzone',
        'adsbygoogle', 'dfp-ad', 'advert-container', 'bannerrow', 'banner-ad',
        'ad-banner', 'header-ads', 'widget-banner', 'grid-banner',
        'ads-rotation', 'ad-rotation', 'ad-overlay', 'ads-overlay',
        'adsnon-zone', 'ad-fallback-kicker',
    ]);

    // Generic names: only acted upon when the element looks like a slot.
    const GENERIC = new Set([ 'ad', 'ads', 'advert', 'advertisement' ]);

    // Elements that must never be hidden, whatever they are called.
    const PROTECTED_TAGS = new Set([
        'HTML', 'BODY', 'MAIN', 'ARTICLE', 'HEADER', 'FOOTER', 'NAV',
    ]);

    // `data-s` values used by ad-serving scripts.
    const AD_DATA_S = /^(?:banner|adspool|mini|ads?|ad[-_].*)$/i;

    // Container ids following the "ads_<something>" convention used by several
    // ad-serving scripts (ads_fox_bottom, ads_fix_footer, ...). The word must
    // be a separate token so that ids like "downloads" are not matched.
    const AD_CONTAINER_ID = /(^|[-_])(ads?|adsnon)([-_]|$)/i;

    // Container classes following the "adsnon-" or "ads-" naming pattern
    const AD_CONTAINER_CLASS = /(^|\s)(adsnon-[a-z0-9_-]+|ads?-zone)(\s|$)/i;

    // Ad creatives are commonly named after the size they are served in,
    // e.g. "728x180.gif", "Redkong728x180.gif", "728x200-UFAGOOL-1503.gif".
    const AD_CREATIVE_SIZE = /(\d{3,4})\s*[x\u00d7]\s*(\d{2,4})/i;

    // Hosts that only ever serve advertising on the sites in question.
    const AD_HOSTS = /(^|\.)(chokbet\.now|debetthailand\.win|betflix-4u8\.com|anccplayer\.cyou|redkong89\.cc|london45\.cc|mammoth88\.cc|ufafox88\.dev|googles\.video|adsterra\.[a-z]+|propellerads\.[a-z]+|hilltopads\.net|exoclick\.[a-z]+|ibit\.ly)$/i;

    // Structural content markers: if present, the element is real content.
    const CONTENT_MARKERS = 'h1, h2, h3, h4, h5, h6, article, main';

    const hasContent = ( el ) => el.querySelector( CONTENT_MARKERS ) !== null;

    const SELECTOR = [
        'a[rel~="sponsored"]',
        'a[data-s]',
        '[id]', '[class]',
    ].join(',');

    const hide = ( el ) => {
        if ( el === null || el === undefined ) { return; }
        if ( hidden.has( el ) ) { return; }
        if ( el.nodeType !== 1 ) { return; }
        if ( hasContent( el ) ) { return; }
        if ( PROTECTED_TAGS.has( el.tagName ) ) { return; }
        hidden.add( el );
        el.style.setProperty( 'display', 'none', 'important' );
    };

    const isLowValue = ( el ) => {
        if ( el.matches( 'video, audio, form, input, select, textarea, table' ) ) { return false; }
        if ( hasContent( el ) ) { return false; }
        const lists = el.querySelectorAll( 'ul, ol' );
        for ( const list of lists ) {
            if ( list.children.length > 3 ) { return false; }
        }
        const text = ( el.textContent || '' ).trim();
        if ( text.length > 60 ) { return false; }
        const imgs = el.querySelectorAll( 'img' );
        for ( const img of imgs ) {
            const alt = ( img.getAttribute( 'alt' ) || '' ).trim();
            if ( alt.length > 2 ) { return false; }
        }
        return true;
    };

    const isAdLink = ( el ) => {
        if ( el.tagName !== 'A' ) { return false; }
        const rel = ( el.getAttribute( 'rel' ) || '' ).toLowerCase();
        if ( rel.split( /\s+/ ).includes( 'sponsored' ) ) { return true; }
        const dataS = el.getAttribute( 'data-s' );
        if ( dataS !== null && AD_DATA_S.test( dataS ) ) { return true; }
        return false;
    };

    const linkHost = ( el ) => {
        const href = el.getAttribute( 'href' ) || '';
        if ( !/^https?:/i.test( href ) ) { return null; }
        try { return new URL( href, location.href ).host; }
        catch ( e ) { return null; }
    };

    const isExternal = ( el ) => {
        const host = linkHost( el );
        return host !== null && host !== location.host;
    };

    // Returns the ad-creative size advertised by the file name of the image,
    // e.g. "728x180.gif" -> { w: 728, h: 180 }, or null when there is none.
    const creativeSize = ( img ) => {
        const hay = [
            img.getAttribute( 'src' ) || '',
            img.getAttribute( 'data-src' ) || '',
            img.getAttribute( 'alt' ) || '',
            img.getAttribute( 'title' ) || '',
        ].join( ' ' );
        const m = AD_CREATIVE_SIZE.exec( hay );
        if ( m === null ) { return null; }
        const w = parseInt( m[1], 10 );
        const h = parseInt( m[2], 10 );
        if ( w < 120 || h < 40 ) { return null; }
        return { w: w, h: h };
    };

    // An ad banner: a link to another site, marked as an affiliate link,
    // wrapping a picture whose file name gives away the banner size.
    const isAdCreativeLink = ( el ) => {
        if ( el.tagName !== 'A' ) { return false; }
        const host = linkHost( el );
        if ( host === null || host === location.host ) { return false; }
        const text = ( el.textContent || '' ).trim();
        // Banner-named external links (123-hdc style: "banner", "banner2".. "banner10")
        if ( /^banner\d*$/i.test( text ) ) { return true; }
        const rel = ( el.getAttribute( 'rel' ) || '' ).toLowerCase();
        const target = ( el.getAttribute( 'target' ) || '' ).toLowerCase();
        const affiliate = /nofollow|noreferrer|sponsored/.test( rel ) || target === '_blank';
        if ( AD_HOSTS.test( host ) === true ) { return true; }
        if ( affiliate === false ) { return false; }
        const img = el.querySelector( 'img' );
        if ( img === null ) { return false; }
        if ( creativeSize( img ) !== null ) { return true; }
        const naming = ( img.getAttribute( 'alt' ) || '' ) + ' ' + ( img.getAttribute( 'title' ) || '' );
        return /banner/i.test( naming );
    };

    // A container whose links are all ads is itself an ad row.
    const hideAdRow = ( el ) => {
        const parent = el.parentElement;
        if ( parent === null || parent === undefined ) { return; }
        if ( PROTECTED_TAGS.has( parent.tagName ) ) { return; }
        const links = parent.querySelectorAll( 'a' );
        if ( links.length === 0 ) { return; }
        let allAds = true;
        for ( const link of links ) {
            if ( isAdLink( link ) === false ) { allAds = false; break; }
        }
        if ( allAds === false ) { return; }
        if ( isLowValue( parent ) === false ) { return; }
        hide( parent );
    };

    const check = ( el ) => {
        if ( el === null || el === undefined || el.nodeType !== 1 ) { return; }
        const id = el.id;
        if ( id !== '' && STRONG_IDS.has( id ) ) { hide( el ); return; }
        if ( id !== '' && AD_CONTAINER_ID.test( id ) ) { hide( el ); return; }
        if ( isAdCreativeLink( el ) ) {
            hide( el );
            hideAdRow( el );
            return;
        }
        const className = el.className && typeof el.className === 'string' ? el.className : '';
        if ( className !== '' && AD_CONTAINER_CLASS.test( className ) ) { hide( el ); return; }
        const classList = el.classList;
        let strong = false;
        let generic = false;
        for ( let i = 0; i < classList.length; i++ ) {
            const token = classList.item( i );
            if ( STRONG_CLASSES.has( token ) ) { strong = true; break; }
            if ( GENERIC.has( token ) ) { generic = true; }
        }
        if ( strong ) { hide( el ); return; }
        if ( isAdLink( el ) ) {
            hide( el );
            hideAdRow( el );
            return;
        }
        if ( generic && isLowValue( el ) ) { hide( el ); }
    };

    const scan = ( root ) => {
        if ( root === null || root === undefined || root.nodeType !== 1 ) { return; }
        check( root );
        const candidates = root.querySelectorAll(
            'a[href], a[rel~="sponsored"], a[data-s]' );
        for ( let i = 0; i < candidates.length; i++ ) { check( candidates.item( i ) ); }
        const named = root.querySelectorAll( '[id], [class]' );
        for ( let i = 0; i < named.length; i++ ) {
            const el = named.item( i );
            if ( el.id !== '' && STRONG_IDS.has( el.id ) ) { hide( el ); continue; }
            if ( el.id !== '' && AD_CONTAINER_ID.test( el.id ) ) { hide( el ); continue; }
            const className = el.className && typeof el.className === 'string' ? el.className : '';
            if ( className !== '' && AD_CONTAINER_CLASS.test( className ) ) { hide( el ); continue; }
            let strong = false;
            let generic = false;
            const classList = el.classList;
            for ( let j = 0; j < classList.length; j++ ) {
                const token = classList.item( j );
                if ( STRONG_CLASSES.has( token ) ) { strong = true; break; }
                if ( GENERIC.has( token ) ) { generic = true; }
            }
            if ( strong ) { hide( el ); }
            else if ( generic && isLowValue( el ) ) { hide( el ); }
        }
    };

    const start = ( ) => {
        if ( document.body === null ) { return; }
        scan( document.body );
    };

    if ( document.body === null ) {
        document.addEventListener( 'DOMContentLoaded', start, { once: true } );
    } else {
        start();
    }

    let pending = false;
    const observer = new MutationObserver( ( mutations ) => {
        if ( pending === true ) { return; }
        pending = true;
        requestAnimationFrame( ( ) => {
            pending = false;
            for ( const mutation of mutations ) {
                for ( const node of mutation.addedNodes ) {
                    if ( node.nodeType === 1 ) { scan( node ); }
                }
            }
        } );
    } );

    const observe = ( ) => {
        if ( document.body === null ) { return; }
        observer.observe( document.body, { childList: true, subtree: true } );
    };

    if ( document.body === null ) {
        document.addEventListener( 'DOMContentLoaded', observe, { once: true } );
    } else {
        observe();
    }
}

registerScriptlet(adHiderFn, {
    name: 'ad-hider.js',
    world: 'MAIN',
    requiresTrust: true,
});
