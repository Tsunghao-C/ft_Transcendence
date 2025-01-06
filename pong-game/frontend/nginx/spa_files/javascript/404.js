import { translations } from "./language_pack.js";
import { getLanguageCookie } from "./fetch_request.js";

export function set404View(contentContainer) {
	const currentLanguage = getLanguageCookie() ||  "en";
	contentContainer.innerHTML = `
	<div class="error404-view">
		<div class="404-center">
			<h1 >${translations[currentLanguage].error404Title}</h1>
			<div>${translations[currentLanguage].error404Message}</div>
		</div>
	</div>
`;
}
