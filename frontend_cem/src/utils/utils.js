import { saveAs } from 'file-saver';

/**
 * export data to file
 * @param {*} data - BlobParts 
 * @param {*} fileName - File name with extension
 * @param {*} mimeType
 * 
 *
 *  @example
 *  const data = 'Hello, world!';
 *  const mimeType = 'text/plain';
 *  const fileName = 'example.txt';
 *  //download blob as file
 *  exportBlob(data, mimeType, fileName); 
 */
function exportBlob(data, fileName, mimeType) {
    // Create a Blob object from the data
    var blob = null;
    if (mimeType != null) {
        blob = new Blob([data], { type: mimeType });
    } else {
        blob = new Blob([data]);
    }

    // Create a URL representing the Blob
    const url = URL.createObjectURL(blob);

    // Create a link element
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;

    // Simulate a click on the link to trigger the download
    link.click();

    // Clean up by revoking the URL
    URL.revokeObjectURL(url);
}

function decodeUnicodeEscapeSequences(str) {
    // Replace Unicode escape sequences with their corresponding characters
    return str.replace(/\\u([\dA-Fa-f]{4})/g, (match, grp) => String.fromCharCode(parseInt(grp, 16)));
}

/**
 * 
 * @param {*} url 
 * @param {*} fileName 
 * @param {*} accept_type 
 * 
 * @reference https://github.com/eligrey/FileSaver.js
 */
function fetchAndExport(url, fileName) {
    var file_name = "download";
    if (fileName != null) {
        file_name = fileName;
    }
    fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("soc_token")}`,
        }
    })
        .then(async (response) => {
            var blob = await response.blob();
            blob = new Blob([blob]);
            return blob;
        })
        .then((blob) => {
            saveAs(blob, file_name);
        });
}

export { decodeUnicodeEscapeSequences, exportBlob, fetchAndExport };
