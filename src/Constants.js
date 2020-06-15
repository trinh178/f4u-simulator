function parseQueryString() {
    const str = window.location.search;
    const objURL = {};
  
    str.replace(
        new RegExp( "([^?=&]+)(=([^&]*))?", "g" ),
        function( $0, $1, $2, $3 ){
            objURL[ $1 ] = $3;
        }
    );
    return objURL;
};

const DEV_ENDPOINT = "https://gya6ha83ql.execute-api.ap-southeast-1.amazonaws.com/Dev/api";
const TIC_ENDPOINT = "http://f4u-tic.ap-southeast-1.elasticbeanstalk.com/api";
export let ENV = "dev";
switch (parseQueryString().env) {
    case "dev":
        ENV = "dev";
        break;
    case "tic":
        ENV = "tic";
        break;
    default:
        ENV = "dev";
        break;
}
export const BASE_URL = ENV == "tic" ? TIC_ENDPOINT : DEV_ENDPOINT;