import { fetchWithToken } from "./fetch_request.js";
import { getLanguageCookie } from './fetch_request.js';

export function setHomePage(contentContainer) {
	// contentContainer.innerHTML = `
	// 	<div class="home-view">
	// 		<label for="profilePictureInput" class="form-label" data-i18n="profilePicture">Profile Picture</label>
	// 		<input type="file" class="form-control" id="profilePictureInput" accept=".jpg, .jpeg, .png">
	// 		<small class="form-text text-muted" data-i18n="profilePictureHint">Only .jpg and .png files are allowed.</small>
	// 		<button type="button" id="test" class="btn btn-light" data-i18n="loginButton">Test Stuff</button>
	// 	</div>
	// `;
	contentContainer.innerHTML = `
		<div class="home-view">
			<h2>Welcome, [Username] !</h2>
			<p style="font-size: 1rem;">We can fill this welcome page with :</p>
			<ul>
				<li>Current MMR</li>
				<li>Last game played (opponent, result ...)</li>
				<li>Last chatroom used</li>
				<li>Unread messages</li>
			</ul>
		</div>
	`;
}
