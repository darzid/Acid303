let flags = {};
let appUrl = window.location.toString();
let locationParts = appUrl.split("?");
if (locationParts.length > 1) {
	let queryStringParts = locationParts[1].split("&");
	queryStringParts.forEach(queryStringPart => {
		let argumentParts = queryStringPart.split("=");
		flags[argumentParts[0]] = argumentParts[1];
		console.log(`Flag ${argumentParts[0]}=${argumentParts[1]}`);
	});
}