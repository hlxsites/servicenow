# Service Now 

Service Now Blog implementation

## Environments
- Preview: https://main--aemeds--servicenow-martech.hlx.page
- Live: https://main--aemeds--servicenow-martech.hlx.live

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Local development

1. Install the [AEM CLI](https://github.com/adobe/aem-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `{repo}` directory in your favorite IDE and start coding :)

### Preventing Adobe launch from being loaded locally

prepend ?disableLaunch=true to the url to prevent Adobe Launch from being loaded.
that will also prevent loading the consent management.
