import { translations } from "./language_pack.js";
import { getLanguageCookie } from "./fetch_request.js";

export function set404View(contentContainer) {
	const currentLanguage = getLanguageCookie() ||  "en";
	contentContainer.innerHTML = `
	<div class="error404-view">
		<h1 >${translations[currentLanguage].error404Title}</h1>
		<p >${translations[currentLanguage].error404Message}</p>
	</div>
`;
}
