// libairie pour représentation du voisinage et association groupe de device zwave
var stage = {};
var layer = {};
var linkLayer = {};

var tooltipLayer = new Kinetic.Layer();
var tooltip = new Kinetic.Text({
        text: "essais",
        fontFamily: "Calibri",
        fontSize: 12,
        padding: 5,
        textFill: "white",
        fill: "black",
        alpha: 0.75,
        visible: false
    });


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
        this.parent.draw();
        document.body.style.cursor = "pointer";
        });
            
    this.group.on("mouseout", function() {
        var img = this.get(".nodeimg");
        img[0].setFill("yellow");
        tooltip.hide();
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
//    this.layer.add(this.nodeImg); 
};

CNode.prototype.addlink = function(linker) {
    var idx = this.links.indexOf(linker);
    if (idx == -1) {
        this.links.push(linker);
        linker.addnode(this);           
   //     linker.draw();
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
    layer.add(this.link);
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
   //     this.layer.moveToBottom();
        this.layer.draw();
        }
};

CLink.prototype.draw= function() {
    this.layer.draw();
};
        
window.onload = function() {

   //  tooltipLayer.listen(true);
     tooltipLayer.add(tooltip);
      }; 
