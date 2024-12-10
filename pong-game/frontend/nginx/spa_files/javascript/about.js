
export function setAboutPage(contentContainer) {
	contentContainer.innerHTML = `
		<div class="about-view">
			<h2 data-i18n="about">About</h2>
			<p>This is a pong game.</p>
		</div>
		`;
}