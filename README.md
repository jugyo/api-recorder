# api-recorder

API recorder also works as a proxy.

# Usage


    npx api-recorder <origin> <port-to-proxy> <dir-to-save-data>

ie.

    npx api-recorder https://your-api.com 4000 ./tmp/api-recorder/

## To let it work as proxy for some reason

    JUST_PROXY=true api-recorder https://your-api.com 4000 ./tmp/api-recorder/
