/***
 * Make a copy of this file and name it `config.js`
 *
 * ATTENTION. You'll need to up update this config with values you get using
 * your dev tools.
 */

// These next two values come from the main page listing all your pay stubs.
// https://www.canadapost-postescanada.ca/inbox/en#!/inbox

// This is the _REQUEST_ Cookie sent after logging in.
// Just login and refresh the page to see it in it's full value.
export const canadapostPostescanadaCookie = "-- TODO --";

// Get with: document.querySelectorAll("meta[name=sso-token]")[0].content
export const canadapostPostescanadaCsrfToken = "-- TODO --";

// These last two values are from the epost.ca page that displays the actual
// PDF: https://www.epost.ca/service/displayMailStream.a
// Click on one of your pay stubs and open the dev tools in the new window that
// displays the PDF.
export const epostCaCookie = "-- TODO --";

// This is one of the query params sent to https://www.epost.ca/service/displayMailStream.a
export const epostCaOWASP_CSRFTOKEN = "-- TODO --";
