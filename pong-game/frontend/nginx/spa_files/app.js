function loadPage(page) {
	const contentContainer = document.getElementById("content");

	if (page === "home") {
		contentContainer.innerHTML = "<h1>Home</h1><p>Welcome!</p>"; //should add different display depends on logged or not
	} else if (page === "about") {
		contentContainer.innerHTML = "<h1>About</h1><p>to fill.</p>";
	} else {
		contentContainer.innerHTML = "<h1>404</h1><p>error 404 page not found</p>"; //should get a custom page.
	}
}

function handleNavigation(event) {
	event.preventDefault();

	const newPage = event.target.getAttribute("href").substring(1);
	loadPage(newPage);
	window.history.pushState({ page: newPage }, newPage, "#" + newPage);

	updateActiveLink();
}

function updateActiveLink() {
	const links = document.querySelectorAll('.nav-link');

	links.forEach(link => {
		link.classList.remove('active');
	});

	const currentLink = document.querySelector(`a[href="${window.location.hash}"]`);
	if (currentLink) {
		currentLink.classList.add('active');
	}
}

document.addEventListener("DOMContentLoaded", function () {
	const currentPage = window.location.hash.substring(1) || "home";
	loadPage(currentPage);
	updateActiveLink();

	const links = document.querySelectorAll("a");
	links.forEach(link => {
		link.addEventListener("click", handleNavigation);
	});

	window.addEventListener("popstate", function (event) {
		const page = event.state ? event.state.page : "home";
		loadPage(page);
		updateActiveLink();
	});

	window.addEventListener('hashchange', updateActiveLink);
});
