const script = document.createElement("script");
script.src = `https://maps.googleapis.com/maps/api/js?key=${env.GOOGLE.KEY}&libraries=places`;
document.head.appendChild(script);
