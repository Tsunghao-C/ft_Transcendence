export function hideElem(elemId) {
	const elem = document.getElementById(elemId);
	elem.style.display = "none";
}

export function hideClass(className) {
	const elements = document.getElementsByClassName(className);
	Array.from(elements).forEach(elem => {
		elem.style.display = "none";
	});
}

export function showElem(elemId, display) {
	const elem = document.getElementById(elemId);
	elem.style.display = display;
}

export function showClass(className, display) {
	const elements = document.getElementsByClassName(className);
	Array.from(elements).forEach(elem => {
		elem.style.display = display;
	});
}

export function clearInput(inputId) {
    const input = document.getElementById(inputId);
    input.value = "";
}