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

// ad-gate-skip.js
//
// Removes the pre-roll (roll-in) advertising of the "adgate" video player
// used by the Thai streaming sites (playlist.streamhls1688.com).
//
// How that player works: it plays the advertisement first and only then the
// movie. Blocking the advertisement by URL is not an option - the player
// waits for the ad to *complete* and would never start the movie.
//
// So the advertisement is let through, and skipped as soon as it appears:
// the JWPlayer instance is asked to skip the ad, and if that is not possible
// the player's own "skip" control is clicked. The movie then starts right
// away, and the ad is never really shown.
//
// The scriptlet only acts on pages that really are an adgate player, so
// other sites are left alone.

import { registerScriptlet } from './base.js';

export function adGateSkipFn() {
    'use strict';

    if ( window.__ubolAdGateSkip === true ) { return; }
    window.__ubolAdGateSkip = true;

    // Only touch the adgate player.
    const isPlayerPage = ( ) => {
        try {
            if ( /streamhls|adgate/i.test( location.hostname ) ) { return true; }
            if ( document.querySelector( '#adgate-app, .adgate-shell, [id^="adgate-"], [class*="adgate-"]' ) !== null ) {
                return true;
            }
        } catch ( e ) { }
        return false;
    };

    // Hide the pop-up advertisement of the same network.
    const hidePopups = ( ) => {
        const sel = '[class*="popup" i][class*="ad" i], [id*="popup" i][id*="ad" i], .adgate-popup';
        for ( const el of document.querySelectorAll( sel ) ) {
            if ( el.offsetParent === null ) { continue; }
            el.style.setProperty( 'display', 'none', 'important' );
        }
    };

    const skipViaPlayerApi = ( ) => {
        try {
            if ( typeof window.jwplayer !== 'function' ) { return false; }
            const ids = [ 'adgate-ad-player', 'adgate-player', 'adgate-content' ];
            for ( const id of ids ) {
                let player = null;
                try { player = window.jwplayer( id ); } catch ( e ) { }
                if ( !player ) { continue; }
                for ( const method of [ 'skipAd', 'skip' ] ) {
                    if ( typeof player[method] === 'function' ) {
                        player[method]();
                        return true;
                    }
                }
            }
        } catch ( e ) { }
        return false;
    };

    const skipViaDom = ( ) => {
        const sel = [
            '[class*="skip" i]',
            '[id*="skip" i]',
            '[class*="ad-close" i]',
            '[id*="ad-close" i]',
            '[class*="adgate-close" i]',
        ].join( ',' );
        let fallback = null;
        for ( const el of document.querySelectorAll( sel ) ) {
            if ( el.offsetParent === null ) { continue; }
            const text = ( el.textContent || '' ).trim();
            if ( /skip|ข้าม|ปิดโฆษณา|close/i.test( text ) || el.className.toString().length !== 0 ) {
                el.click();
                return true;
            }
            if ( fallback === null ) { fallback = el; }
        }
        if ( fallback !== null ) {
            fallback.click();
            return true;
        }
        return false;
    };

    let attempts = 0;
    const tick = ( ) => {
        attempts++;
        if ( isPlayerPage() === false ) { return; }
        hidePopups();
        if ( skipViaPlayerApi() === false ) { skipViaDom(); }
        if ( attempts < 240 ) { setTimeout( tick, 500 ); }
    };

    setTimeout( tick, 500 );
}

registerScriptlet(adGateSkipFn, {
    name: 'ad-gate-skip.js',
    world: 'MAIN',
    requiresTrust: true,
});
