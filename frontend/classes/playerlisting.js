class playerListing {
    constructor(DOMElement, enabled) {
        this.element = DOMElement;
        this.active = enabled;
        if (this.active === true) this.activate();
        else this.deactivate();
    }

    toggle() {
        if (this.active === true) this.deactivate();
        else this.activate();
    }

    activate() {
        this.active = true;
        this.element.children[0].style.boxShadow = "inset 0 -30px 30px -31px var(--white)";
        this.element.children[0].style.borderBottomColor = "var(--white)";
    }

    deactivate() {
        this.active = false;
        this.element.children[0].style.boxShadow = "inset 0 -30px 30px -31px var(--black)";
        this.element.children[0].style.borderBottomColor = "var(--black)";
    }
}