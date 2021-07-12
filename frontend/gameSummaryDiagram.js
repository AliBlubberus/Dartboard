const diagramSVG = document.getElementById("gameSummaryDiagram");
const ns = "http://www.w3.org/2000/svg";

window.onload = generateGraph();

function generateGraph() {
    console.log("Generating Graph...");

    let layer1 = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    layer1.setAttribute("class", "diagramLayer1");
    layer1.setAttribute("style", "stroke:#FF4631;stroke-width:2");
    layer1.setAttribute("points", generatePointDefinition());


    diagramSVG.appendChild(layer1);
}

function generatePointDefinition(layer) {
    let string = "";

    for (let i = 0 ; i <= 30 ; i++) {
        let x = 500 / 30 * i;
        let y = 200 - (Math.random() * 200);

        string += " " + x.toString() + "," + y.toString();
    }

    return string;
}