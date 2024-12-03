import { translations } from "./language_pack.js";

export function set404View(contentContainer) {
	const currentLanguage = localStorage.getItem("language") || "en";
	contentContainer.innerHTML = `
	<h1 >${translations[currentLanguage].error404Title}</h1>
	<p >${translations[currentLanguage].error404Message}</p>
`;
}
