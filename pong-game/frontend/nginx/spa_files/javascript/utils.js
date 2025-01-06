export function hideElem(elemId) {
	const elem = document.getElementById(elemId);
    if (!elem) {
        console.log("ShowElem: elem is null: ", elemId);
        return;
    }
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
	if (!elem) {
        console.log("ShowElem: elem is null: ", elemId);
        console.trace("Trace: ");
		return;
    }
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

export function isAlphanumeric(content, name = "Alias", displayAlert = true) {
    const isValid = /^[a-zA-Z0-9]+$/.test(content);

	if (!isValid && displayAlert) {
		alert(name + " can only be made of alphanumerical characters");
	}
    return isValid;
}
