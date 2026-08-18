## How it works?

Take a look at original PR:
https://github.com/rango-exchange/rango-client/pull/601


## Usage

log your messages using:
```
@arthur2079/logging-core
```

Listen to you logs (only on clients):
```json
    "@arthur2079/logging-subscriber": "0.1.0",
    "@arthur2079/logging-console": "0.1.0",
```

and 

```js
import { init, Level } from '@arthur2079/logging-subscriber';
import { layer as consoleLayer } from '@arthur2079/logging-console';

init([consoleLayer()], {
    baseLevel: Level.Trace,
});

```