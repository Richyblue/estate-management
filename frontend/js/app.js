async function loadComponent(id, path) {

    try {

        const response = await fetch(path);

        const html = await response.text();

        document.getElementById(id).innerHTML = html;

    } catch (error) {

        console.error(`Failed to load ${path}`, error);

    }

}


// Load Shared Components

document.addEventListener("DOMContentLoaded", async () => {

    await loadComponent(
        "preloader-container",
        "components/preloader.html"
    );
    await loadComponent(
        "navbar-containers",
        "components/navbar.html"
    );

    await loadComponent(
        "header-container",
        "components/header.html"
    );
    
    

    await loadComponent(
        "sidebar-container",
        "components/sidebar.html"
    );
    await loadComponent(
        "walletsidebar-containers",
        "components/walletSidebar.html"
    );
    setTimeout(() => {

        if (window.$) {
    
            $("#menu").metisMenu();
    
        }
    
    }, 100);

    
    

    await loadComponent(
        "footer-container",
        "components/footer.html"
    );

});