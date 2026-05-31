const routes = {

    "/dashboard": {
        page: "views/dashboard.html",
        title: "Dashboard"
    },

    "/students": {
        page: "views/students.html",
        title: "Students"
    }

};

async function loadRoute() {

    const path =
        window.location.hash.replace("#", "")
        || "/dashboard";

    const route =
        routes[path] || routes["/dashboard"];

    const html =
        await fetch(route.page)
        .then(res => res.text());

    document.getElementById("app")
        .innerHTML = html;

    document.title =
        route.title;
}

document.addEventListener("click", (e) => {

    const link =
        e.target.closest(".nav-link");

    if (!link) return;

    e.preventDefault();

    window.location.hash =
        link.getAttribute("href");

});

window.addEventListener(
    "hashchange",
    loadRoute
);

loadRoute();