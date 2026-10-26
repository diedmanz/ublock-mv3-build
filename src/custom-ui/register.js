(async () => {
    const out = document.getElementById('out');
    const log = (s) => { out.textContent += '\n' + s; };
    try {
        // 1. Recompile the sandbox filters, so the scriptlets match the
        //    current build, then read the compiled result. The service worker
        //    does not always answer that message, so never wait for it.
        const withTimeout = (p, ms) => Promise.race([
            p, new Promise(r => setTimeout(() => r('timeout'), ms)),
        ]);
        let text = '';
        try {
            const st = await chrome.storage.local.get(['sandboxFilters']);
            text = st.sandboxFilters || '';
            if (text !== '') {
                const res = await withTimeout(
                    chrome.runtime.sendMessage({ what: 'setSandboxFilters', text }), 5000);
                if (res === 'timeout') { log('recompile timed out, using stored scriptlets'); }
                else { await new Promise(r => setTimeout(r, 2000)); }
            }
        } catch (e) { log('recompile skipped: ' + e.message); }

        // 2. Build the registration directives out of the compiled scriptlets.
        const store = await chrome.storage.local.get([
            'sandboxFilters.userScripts',
            'importedFilters.userScripts',
        ]);
        const matchesFromHostnames = (hostnames) => {
            if (typeof hostnames !== 'string' || hostnames === '') { return ['<all_urls>']; }
            if (hostnames === '*') { return ['<all_urls>']; }
            return hostnames.split(',').map(h => {
                h = h.trim();
                if (h === '') { return null; }
                if (h.startsWith('*.')) { return '*://*.' + h.slice(2) + '/*'; }
                if (h.startsWith('~')) { return '*://' + h.slice(1) + '/*'; }
                return '*://' + h + '/*';
            }).filter(x => x !== null);
        };
        const toAdd = [];
        for (const [kind, blob] of [['sandbox', store['sandboxFilters.userScripts']],
                                    ['imported', store['importedFilters.userScripts']]]) {
            if (!blob) { continue; }
            for (const world of ['ISOLATED', 'MAIN']) {
                const list = blob[world] || [];
                for (const script of list) {
                    toAdd.push({
                        id: script.id,
                        world: world === 'MAIN' ? 'MAIN' : 'USER_SCRIPT',
                        allFrames: true,
                        js: [{ code: script.code }],
                        runAt: 'document_start',
                        matches: matchesFromHostnames(script.hostnames),
                    });
                }
            }
        }
        if (toAdd.length === 0) {
            out.className = 'bad';
            out.textContent = 'No compiled scriptlet found in storage.';
            return;
        }

        // 3. Replace whatever is registered.
        try { await chrome.userScripts.unregister(); } catch (e) { }
        await chrome.userScripts.register(toAdd);
        const now = await chrome.userScripts.getScripts();
        out.className = 'ok';
        out.textContent = 'Registered ' + now.length + ' user script(s):\n' +
            now.map(s => '  - ' + s.id + '  ' + (s.matches || []).join(',')).join('\n');
    } catch (e) {
        out.className = 'bad';
        out.textContent = 'Failed: ' + (e && e.message ? e.message : String(e));
    }
})();
