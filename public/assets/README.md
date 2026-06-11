# Tijdelijke updatecompatibiliteit

`index-YQYEjLgL.js` is de JavaScriptbundel van releasecommit `ff6e475`.

GitHub Pages kan `index.html` maximaal tien minuten cachen. De oude service worker
verwijderde tijdens release `61b4083` de vorige runtimecache voordat alle clients
de nieuwe HTML hadden ontvangen. Daardoor kon oude HTML kort verwijzen naar deze
inmiddels verwijderde bundel en bleef de geïnstalleerde PWA grijs.

Laat dit bestand staan totdat alle bestaande `fh6-tune-v5`-clients aantoonbaar
naar het atomaire cachemodel vanaf `fh6-tune-v6` zijn gemigreerd.
