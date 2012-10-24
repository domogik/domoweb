// libairie pour représentation du voisinage et association groupe de device zwave
var stage;
var areas, scrollbars;
var nodeLayer, linkLayer, scrollLayer, tooltipLayer;
var tooltip;

CNode = function  (x,y,r,node,layer) {
    this.group = new Kinetic.Group({
          x: x,
          y: y,
          draggable: true,
          nodeP : this
        });
    this.nodeImg = new Kinetic.Circle({
        x: 0,
        y: 0,
        radius: r,
        fill: 'yellow',
        stroke: 'black',
        strokeWidth: 4,
        name:"nodeimg",
        nodeP : this
        });
    this.text = new Kinetic.Text({
        x: -r +2,
        y: -5,
        width:2*r-4,
        text: "Node " + node.Node,
        fontSize: 12,
        fontFamily: "Calibri",
        textFill: "black",
        align : "center"
    });
    this.group.add(this.nodeImg);
    this.group.add(this.text);
    this.links = new Array ();
    this.nodeobj = node;
    this.layer = layer;
    this.group.on("mouseover", function() {
        var img = this.get(".nodeimg");
        img[0].setFill("orange");
        img[0].setAlpha(0.5);
        this.parent.draw();
        document.body.style.cursor = "pointer";
        });
            
    this.group.on("mouseout", function() {
        var img = this.get(".nodeimg");
        img[0].setFill("yellow");
        tooltip.hide();
        img[0].setAlpha(1);
        this.parent.draw();
        tooltipLayer.draw();
        document.body.style.cursor = "default";
    });
    
    this.group.on("dragmove", function() {
      for (var i=0; i<this.attrs.nodeP.links.length;i++) {
          this.attrs.nodeP.links[i].follownode(this.attrs.nodeP);
      };
      this.moveToTop();         
    });
    this.group.on("mousemove", function(){
        var mousePos = stage.getMousePosition();
        tooltip.setPosition(mousePos.x + 5, mousePos.y + 5);
        tooltip.setText(this.attrs.nodeP.nodeobj.Type);
        tooltip.show();
        tooltipLayer.draw();
        mousePos=0;
    });
    this.layer.add(this.group); 
};

CNode.prototype.addlink = function(linker) {
    var idx = this.links.indexOf(linker);
    if (idx == -1) {
        this.links.push(linker);
        linker.addnode(this);           
    };
};               

CNode.prototype.removelink= function(linker) {
    var idx = this.links.indexOf(linker)
    if (idx == -1) {
        this.links.splice(idx);
        linker.removenode(this);           
        linker.draw();
    };
};
                     
CLink = function (N1,N2,layer) {
            // build linelink
    this.link = new Kinetic.Line({
      strokeWidth: 10,
      stroke: "green",
      points: [{
        x: N1.group.getX(),
        y: N1.group.getY()
      }, {
        x: N2.group.getX(),
        y: N2.group.getY()
      }]
    });
    this.layer = layer;
    this.nodes = new Array (N1, N2);
    this.layer.add(this.link);
    N1.addlink(this);
    N2.addlink(this);
};

CLink.prototype.addnode = function(node) {
    var idx = this.nodes.indexOf(node);
    if (idx == -1) {
        this.nodes.push(nodes);                
        node.addnode(this);           
        this.layer.draw();
    };
};               
CLink.prototype.removelink= function(node) {
    var idx = this.nodes.indexOf(node)
    if (idx != -1) {
        this.nodes.splice(idx);
        node.removenode(this);           
        this.layer.draw();
    };
};
CLink.prototype.follownode = function(node) { 
    var idx = this.nodes.indexOf(node)
    if (idx != -1) {
        this.link.attrs.points[idx] = node.group.getPosition();
        this.layer.draw();
        }
};

CLink.prototype.draw= function() {
    this.layer.draw();
};
  
function initScrollbars() {
  //  horizontal scrollbars
    
    var hscrollArea = new Kinetic.Rect({
        x: 0,
        y: stage.getHeight() - 20,
        width: stage.getWidth() - 30,
        height: 20,
        fill: "black",
      alpha: 0.3
    });

    var hscroll = new Kinetic.Rect({
        x: ((stage.getWidth()-30)/2) - 65,
        y: stage.getHeight() - 20,
        width: 130,
        height: 20,
        fill: "#9f005b",
        draggable: true,
        dragConstraint: "horizontal",
        dragBounds: {
        left: 00,
        right: stage.getWidth() - 160
        },
        alpha: 0.9,
        stroke: "black",
        strokeWidth: 1
    });
 // vertical scrollbars
    var vscrollArea = new Kinetic.Rect({
        x: stage.getWidth() - 20,
        y: 0,
        width: 20,
        height: stage.getHeight() - 30,
        fill: "black",
        alpha: 0.3
    });

    var vscroll = new Kinetic.Rect({
        x: stage.getWidth() - 20,
        y: ((stage.getHeight()-30)/2) - 35,
        width: 20,
        height: 70,
        fill: "#9f005b",
        draggable: true,
        dragConstraint: "vertical",
        dragBounds: {
        top: 00,
        bottom: stage.getHeight() - 100
        },
        alpha: 0.9,
        stroke: "black",
        strokeWidth: 1
    });
 // scrollbars events assignation
    scrollbars.on("mouseover", function() {
        document.body.style.cursor = "pointer";
    });
    scrollbars.on("mouseout", function() {
        document.body.style.cursor = "default";
    });
    scrollLayer.beforeDraw(function() {
        var x = -1 * ((hscroll.getPosition().x + (hscroll.getWidth() /2)) - (hscrollArea.getWidth()/2));
        var y = -1 * ((vscroll.getPosition().y + (vscroll.getHeight() /2)) - (vscrollArea.getHeight()/2));
        $("#listenodes").html("x = " + x + " ,y = " + y);
        nodeLayer.setPosition(x,y);
        linkLayer.setPosition(x,y);
        nodeLayer.draw();
        linkLayer.draw();
    });
    
    areas.add(hscrollArea);
    areas.add(vscrollArea);
    scrollbars.add(hscroll);
    scrollbars.add(vscroll);
    scrollLayer.add(areas);
    scrollLayer.add(scrollbars);
    window.onresize = function resizeStage(){
       var cont =  document.getElementById("graphneighbors");
       var w = cont.getBoundingClientRect();
       var dw = (w.width - 25) - stage.getWidth() ;
       vscroll.setX(vscroll.getX() + dw);
       vscrollArea.setX(vscrollArea.getX() + dw);
       hscrollArea.setWidth(hscrollArea.getWidth() + dw);
       stage.setWidth(w.width - 25);
       hscroll.setDragBounds({left:0, right:(stage.getWidth() - 160)});
     };
};

function buildKineticNeighbors() {
        stage.reset();
        initScrollbars();
        tooltipLayer.add(tooltip);
        var xc= stage.getWidth() / 2;
        var yc= stage.getHeight() / 2
        var stepR = 80;
        var Ray = 100;
        var a = 0,x=0,y=0; sta=20;
        var r=100;
        for (var i=0; i<listNodes.length;i++) {
  //        $('#listenodes').html(listNodes[i].Model);
            if (listNodes[i].Type == 'Static PC Controller') {r = 40;
                x= xc;
                y= yc;
            } else {r=25;
                x= xc + Ray * Math.cos(a*Math.PI/180);
                y= yc + Ray * Math.sin(a*Math.PI/180);
                if (a > 330) { a = sta;
                    sta = sta +20;
                    Ray = Ray + stepR;
                } else { a= a + 40;
                };
            };
            listNodes[i].Cnode = new CNode(x,y,r,listNodes[i],nodeLayer);
          };
        for (var i=0; i<listNodes.length;i++)  {         
            for (var ii=0; ii<listNodes[i].Neighbors.length;ii++) {
                for (var id2=0; id2<listNodes[i].Neighbors.length;id2++) {
                    if (listNodes[id2].Node == listNodes[i].Neighbors[ii]) { 
                        Link = new CLink(listNodes[i].Cnode, listNodes[id2].Cnode, linkLayer);
                        break;
                    };
                };
            };
        };
        stage.add(linkLayer);        
        stage.add(nodeLayer);
        stage.add(tooltipLayer);
        stage.add(scrollLayer);
    };

function initstage(){
    var cont = document.getElementsByClassName("subsection")
    var width = 810;
    for (var i=0; i < cont.length; i++) {
        if (cont[i].offsetWidth != 0) {
            width = cont[i].offsetWidth - 30;
            break;
            };
        };
   stage = new Kinetic.Stage({
      container: 'containerneighbors',
      width: width,
      height: 500
    });
    nodeLayer = new Kinetic.Layer();
    linkLayer = new Kinetic.Layer();
    scrollLayer = new Kinetic.Layer();
    areas = new Kinetic.Group();
    scrollbars = new Kinetic.Group();

    tooltip = new Kinetic.Text({
        text: "essais",
        fontFamily: "Calibri",
        fontSize: 12,
        padding: 5,
        textFill: "white",
        fill: "black",
        alpha: 0.75,
        visible: false
    });
    tooltipLayer = new Kinetic.Layer();
    buildKineticNeighbors();
};

window.onload = function() {
    var s= 0;
      }; 
