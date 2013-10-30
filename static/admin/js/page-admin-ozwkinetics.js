// libairie pour représentation du voisinage et association groupe de device zwave
var grpsStage;

function getLabelDevice(nodeZW) {
    if (nodeZW.Name != "Undefined" && nodeZW.Name !="") {
        return nodeZW.Name + '\n(' + nodeZW.Node +')';
    } else {
        return "Node " + nodeZW.Node;
    };
};

KtcNode = function  (x,y,r,nodeZW,layer, graph) {
    this.nodeZW = nodeZW;
    this.ktcGraph = graph;
    this.pictureNode = new Kinetic.Group({
          x: x,
          y: y,
          draggable: true,
          name: 'picturenode',
          ktcNode : this
        });
    var op =1;
    if (this.nodeZW['State sleeping']) {op = 0.3; };
    this.pictureImg = new Kinetic.Circle({
        x: 0,
        y: 0,
        radius: r,
        fillRadialGradientStartPoint: 0,
        fillRadialGradientStartRadius: 0,
        fillRadialGradientEndPoint: 0,
        fillRadialGradientEndRadius: r,
        fillRadialGradientColorStops: this.getColorState(),
        stroke: 'black',
        strokeWidth: 2,
        shadowColor: 'black',
        shadowBlur: 2,
        shadowOffset: 5,
        shadowOpacity: 0.5,
        name:"pictureImg",
        opacity: op,
        ktcNode : this
        });
    var t = getLabelDevice(this.nodeZW);
    if (t.length > ((2*r)/5)) { yt = 8-r;
    } else {yt = -5;};
    this.text = new Kinetic.Text({
        x: -r +2,
        y: yt,
        width:2*r-4,
        text: t,
        fontSize: 12,
        fontFamily: "Calibri",
        fill: "black",
        align : "center"
    });
    this.pictureNode.add(this.pictureImg);
    this.pictureNode.add(this.text);
    this.links = new Array ();
    this.layer = layer;
    this.pictureNode.on("mouseover touchstart", function() {
        var img = this.get(".pictureImg");
        img[0].setFillRadialGradientColorStops([0, 'turquoise', 1, 'blue']);
        img[0].setOpacity(0.5);
        this.parent.draw();
        document.body.style.cursor = "pointer";
        });

    this.pictureNode.on("mouseout touchend", function() {
        var img = this.get(".pictureImg");
        img[0].setFillRadialGradientColorStops(this.attrs.ktcNode.getColorState());
        this.attrs.ktcNode.ktcGraph.tooltip.hide();
        var op =1;
        if (this.attrs.ktcNode.nodeZW['State sleeping']) {op = 0.3; };
        img[0].setOpacity(op);
        this.parent.draw();
        this.attrs.ktcNode.ktcGraph.tooltipLayer.draw();
        document.body.style.cursor = "default";
    });

    this.pictureNode.on("dragmove", function() {
      for (var i=0; i<this.attrs.ktcNode.links.length;i++) {
          this.attrs.ktcNode.links[i].follownode(this.attrs.ktcNode);
      };
      this.moveToTop();         
    });
    this.pictureNode.on("mousemove", function(){
        var mousePos = this.attrs.ktcNode.ktcGraph.ktcStage.getMousePosition();
        this.attrs.ktcNode.ktcGraph.tooltip.setPosition(mousePos.x + 5, mousePos.y + 5);
        var t = this.attrs.ktcNode.nodeZW.Type + ', Quality : ' + this.attrs.ktcNode.nodeZW.ComQuality + '%';
        for (var i=0; i<this.attrs.ktcNode.nodeZW.Groups.length; i++) {
            if (this.attrs.ktcNode.nodeZW.Groups[i].members.length !==0) {
                t = t+ '\n associate with node : ';
                for (var ii=0; ii<this.attrs.ktcNode.nodeZW.Groups[i].members.length; ii++) {
                    t= t  + this.attrs.ktcNode.nodeZW.Groups[i].members[ii].id+ ',';
                };
            } else {
             t = t+ '\n no association ';
            };
            t = t + ' in index ' + this.attrs.ktcNode.nodeZW.Groups[i].index + ' named :' + this.attrs.ktcNode.nodeZW.Groups[i].label;
        };
        this.attrs.ktcNode.ktcGraph.tooltip.setText(t);
        this.attrs.ktcNode.ktcGraph.tooltip.show();
        this.attrs.ktcNode.ktcGraph.tooltipLayer.draw();
        mousePos=0;
    });
    this.layer.add(this.pictureNode); 
};

KtcNode.prototype.addlink = function(linker) {
    var idx = this.links.indexOf(linker);
    if (idx == -1) {
        this.links.push(linker);
        linker.addnode(this);
    };
};               

KtcNode.prototype.removelink= function(linker) {
    var idx = this.links.indexOf(linker);
    if (idx == -1) {
        this.links[idx].destroy();
        this.links.splice(idx, 1);
        linker.draw();
    };
};

KtcNode.prototype.checklinks= function() {
    var idn = -1;
    for (var idx in this.links) {
        if (this.links[idx].ktcNodes[1].nodeZW.Node != this.nodeZW.Node) {
            idn = this.nodeZW.Neighbors.indexOf(this.links[idx].ktcNodes[1].nodeZW.Node);
            if (idn == -1) { // Link must me removed
                this.links[idx].destroy();
                this.links.splice(idx, 1);
            };
        };
    };
    var create = true;
    for (idn in this.nodeZW.Neighbors) {
        create = true;
        for (idx in this.links) {
            if (this.links[idx].ktcNodes[1].nodeZW.Node == this.nodeZW.Neighbors[idn]) {
                create = false;
                break;
            };
        };
        if (create) {
            N2 = GetZWNodeById(this.nodeZW.Neighbors[idn]);
            if (N2) {new KtcLink(this, N2.ktcNode, this.ktcGraph.linkLayer);};
        };
    };
    this.ktcGraph.linkLayer.draw();
};

KtcNode.prototype.getColorState = function() {
    var colors = [0, 'yellow', 0.5, 'orange', 1, 'blue'];
    switch (this.nodeZW['InitState']) {
        case 'Uninitialized' : 
            colors = [0, 'red', 0.5, 'orange', 1, 'red'];
            break;
        case 'Initialized - not known' : 
            colors = [0, 'orange', 0.5, 'orange', 1, 'yellow'];
            break;
        case 'Completed' : 
            colors = [0, 'yellow', 0.5, 'yellow', 1, 'green'];
            break;
        case 'In progress - Devices initializing' : 
            colors = [0, 'orange', 0.5, 'brown', 1, 'violet'];
            break;
        case 'In progress - Linked to controller' : 
            colors = [0, 'brown', 0.5, 'violet', 1, 'turquoise'];
            break;
        case 'In progress - Can receive messages' : 
            colors = [0, 'violet', 0.5, 'turquoise', 1, 'blue'];
            break;
        case 'Out of operation' : 
            colors = [0, 'red', 0.5, 'red', 1, 'orange'];
            break;
        case 'In progress - Can receive messages (Not linked)' : 
            colors = [0, 'turquoise', 0.7, 'yellow', 1, 'red'];
            break;
        };
    return colors;
    };

KtcNode.prototype.getTypeLink = function(Node2) {
    var indice = 1, color = 'green';
    if (this.nodeZW.Capabilities.indexOf("Primary Controller" ) != -1 ) { indice =8;  color ='blue'}
    if (this.nodeZW.Capabilities.indexOf("Routing") != -1) {indice = indice + 2;}
    if (this.nodeZW.Capabilities.indexOf("Beaming" ) != -1) {indice = indice + 1;}
    if (this.nodeZW.Capabilities.indexOf("Listening" ) != -1) { indice = indice + 3;}
    if (this.nodeZW.Capabilities.indexOf("Security") != -1) { color ='yellow';}
    if (this.nodeZW.Capabilities.indexOf("FLiRS") != -1) { indice = indice + 2;}
    if (this.nodeZW['State sleeping']) {indice = indice -2; color = 'orange';}
    if (this.nodeZW['InitState'] == 'Out of operation') {indice = 1,  color = 'red';}
    return {'indice' : indice, 'color' : color}
};

KtcNode.prototype.update = function() {
    this.checklinks();
    this.pictureImg.setFillRadialGradientColorStops(this.getColorState());
    this.ktcGraph.tooltip.hide();
    var op =1;
    if (this.nodeZW['State sleeping']) {op = 0.3; };
    this.pictureImg.setOpacity(op);
    for (var l in this.links)  {this.links[l].update();};
    this.pictureNode.draw();
    this.ktcGraph.tooltipLayer.draw();
    this.ktcGraph.linkLayer.draw();
    console.log('redraw kinetic node :' + this.nodeZW.Node);
};

KtcLink = function (N1,N2,layer) {
            // build linelink
    var t = N1 .getTypeLink(N2);
    var x1 = N1.pictureNode.getX(), y1 = N1.pictureNode.getY();
    var x2 = N2.pictureNode.getX(), y2 = N2.pictureNode.getY();   
    var xm = (x1+x2)/2 , ym = (y1 + y2) / 2;
    this.link = new Kinetic.Line({
      strokeWidth: t['indice'], //10,
      stroke: t['color'], // "green",
      lineCap: 'round',
      name: 'linknodes',
      points: [{
        x: x1,
        y: y1
          }, {
        x: xm,
        y: ym
        }]
    });
    this.layer = layer;
    this.ktcNodes = new Array (N1, N2);
    this.layer.add(this.link);
    N1.addlink(this);
    N2.addlink(this);
};

KtcLink.prototype.addnode = function(ktcNode) {
    var idx = this.ktcNodes.indexOf(ktcNode);
    if (idx == -1) {
        this.ktcNodes.push(ktcNode);                
        ktcNode.addnode(this);           
        this.layer.draw();
    };
};               
KtcLink.prototype.removelink= function(ktcNode) {
    var idx = this.ktcNodes.indexOf(ktcNode);
    if (idx != -1) {
        this.ktcNodes.splice(idx, 1);
        ktcNode.removenode(this);           
        this.layer.draw();
    };
};

KtcLink.prototype.asnode= function(ktcNode) {
    var id = this.ktcNodes.indexOf(ktcNode);
    if (id1 != -1) {return true;
    }else {return false};
};
    
KtcLink.prototype.follownode = function(ktcNode) { 
    var id1 = this.ktcNodes.indexOf(ktcNode);
    var id2 =0;
    if (id1 != -1) {
        if (id1 ==0) {id2 =1;};
        var p2 = this.ktcNodes[id2].pictureNode.getPosition();
        var p1 = ktcNode.pictureNode.getPosition();
        var pm = { 'x' : (p2.x+ p1.x) /2, 'y' : (p2.y + p1.y) /2};
        this.link.attrs.points[id1] = p1;
        this.link.attrs.points[id2] = pm;
        if (id2 == 0) { this.link.attrs.points[id2] = pm;
            this.link.attrs.points[id1] = p2;
            } 
        this.layer.draw();
        }
};

KtcLink.prototype.update= function() {
    var t = this.ktcNodes[0].getTypeLink(this.ktcNodes[2]);
    this.link.setStrokeWidth (t['indice']);
    this.link.setStroke(t['color']);
    this.layer.draw();
};


ktcScrollbar = function (contenaire, direction, layer) {
    this.ktcParent = contenaire;
    this.direction = direction;
    var thick = 20;
    var lenght = 130;
    if (this.ktcParent.ktcStage.nodeType = "Stage") {
        thick = 20;
        lenght = 130;
    };
    if (direction == 'horizontal') {
        lenght = (this.ktcParent.ktcStage.getWidth() - thick)  / 3; //130;
        var xOrg = 0, yOrg = this.ktcParent.ktcStage.getHeight() - thick;
        var areaWidth = this.ktcParent.ktcStage.getWidth() - thick;
        var areaHeight = thick;
        var barWidth = lenght;
        var barHeight = thick;
        var xBar = (areaWidth - barWidth)/2; 
        var yBar = yOrg;
    } else { 
        lenght = (this.ktcParent.ktcStage.getHeight() - thick)  / 3; //130;
        var xOrg = this.ktcParent.ktcStage.getWidth() - thick, yOrg = 0;
        var areaWidth = thick;
        var areaHeight = this.ktcParent.ktcStage.getHeight() - thick;
        var barWidth = thick;
        var barHeight = lenght;
        var xBar = xOrg ;
        var yBar = (areaHeight - barHeight)/2;
    };
    this.scrollArea = new Kinetic.Rect({
        x: xOrg,
        y: yOrg,
        width: areaWidth,
        height:areaHeight,
        fill: "black",
        opacity: 0.3,
        name: 'scrollbar'
    });
    this.scrollBar = new Kinetic.Rect({
        x: xBar,
        y: yBar,
        width: barWidth,
        height: barHeight,
        fill: "#90C633",
        draggable: true,
        clearBeforeDraw: true,
        area : this,
        dragBoundFunc: function(pos) {
           if (this.attrs.area.direction == 'horizontal') { // horizontale
                var newX = 0;
                var maxX = this.attrs.area.scrollArea.getWidth() - this.getWidth();
                if ((pos.x > 0) && ( pos.x < maxX)) { 
                    newX = pos.x;
                } else if (pos.x > maxX) {
                    newX = maxX;
                };
                return {
                    x: newX,
                    y: this.getY() 
                };
            } else { // verticale
                var newY = 0;
                var maxY = this.attrs.area.scrollArea.getHeight() -  this.getHeight();
                if ((pos.y > 0) && ( pos.y < maxY)) { 
                    newY = pos.y;
                } else if (pos.y > maxY) {
                    newY = maxY;
                };
                return {
                    x: this.getX(),
                    y: newY
                };
            };
        },
        opacity: 0.9,
        stroke: "black",
        strokeWidth: 1,
        name: 'scrollbar'
    });
    // scrollbars events assignation
    this.scrollBar.on("mouseover touchstart", function() {
        document.body.style.cursor = "pointer";
    });
    this.scrollBar.on("mouseout touchend", function() {
        document.body.style.cursor = "default";
    });
    this.scrollBar.on("dragmove", function() {
        var p = this.attrs.area.ktcParent.getNodesCenter();
        if (this.attrs.area.direction == 'horizontal') { // horizontale
            p.x = this.attrs.area.getScrollPosition();
        } else {
            p.y = this.attrs.area.getScrollPosition();
        };
        this.attrs.area.ktcParent.setNodesCenter(p.x, p.y);
    });
    
    this.scrollBar.on("dragend", function() {
        this.attrs.area.ktcParent.nodeLayer.draw();
        this.attrs.area.ktcParent.linkLayer.draw();
    });
    
    layer.add(this.scrollArea);
    layer.add(this.scrollBar);
}; 

ktcScrollbar.prototype.reziseWidth = function (dw) {
    if (this.direction == 'horizontal') {
        var w = this.scrollArea.getWidth();
        var ratio = (w+dw) / w;
        var areaW = w + dw;
        this.scrollArea.setWidth(areaW);
        var lenght = areaW / 3;
        this.scrollBar.setX(this.scrollBar.getX() * ratio);
        this.scrollBar.setWidth(lenght);
        var offset = this.ktcParent.getNodesCenter();
        this.ktcParent.setNodesCenter(this.getScrollPosition(), offset.y);
    } else {
        this.scrollBar.setX(this.scrollBar.getX() + dw);
        this.scrollArea.setX(this.scrollArea.getX() + dw);
    };
};


ktcScrollbar.prototype.getScrollPosition = function () {
    if (this.direction == 'horizontal') {
        var areaW = this.scrollArea.getWidth();
        var lenght = areaW / 3;
        var scrollPos = (this.scrollBar.getX() + (lenght/2)) - (areaW/2);
        var ratio = this.ktcParent.space.width/ (areaW - lenght);
        var scrollPos = scrollPos * ratio ;
    } else {
        var areaW = this.scrollArea.getHeight();
        var lenght = areaW / 3;
        var scrollPos = (this.scrollBar.getY() + (lenght/2)) - (areaW/2);
        var ratio = this.ktcParent.space.height/ (areaW - lenght);
        var scrollPos = scrollPos * ratio ;
    };
    return scrollPos;
};

KtcNeighborsGraph = function (divId, secId){
    var cont = document.getElementsByClassName("subsection");
    var width = 810;
    for (var i=0; i < cont.length; i++) {
        if (cont[i].offsetWidth !== 0) {
            width = cont[i].offsetWidth - 30;
            break;
            };
        };
    this.ktcStage = new Kinetic.Stage({
        container: divId,
        width: width,
        height: 500,
        neighborsGraph : this
    });
    this.section = secId;
    this.space = {width : 2000, height : 1000};
    this.nodeLayer = new Kinetic.Layer();
    this.linkLayer = new Kinetic.Layer();
    this.scrollLayer = new Kinetic.Layer();

    this.tooltip = new Kinetic.Text({
        text: "essais",
        fontFamily: "Calibri",
        fontSize: 12,
        padding: 15,
        fill: "black",
        opacity: 1,
        visible: false
    });
    this.tooltipLayer = new Kinetic.Layer();
    this.buildKineticNeighbors();
    var graph = this
    window.onresize = function resizeStage(){
        var cont =  document.getElementById(graph.section);
        var w = cont.getBoundingClientRect();
        var dw = (w.width - 25) - graph.ktcStage.getWidth() ;
        graph.ktcStage.setWidth(w.width - 25);
        graph.hScrollBar.reziseWidth(dw);
        graph.vScrollBar.reziseWidth(dw);
     };
};

KtcNeighborsGraph.prototype.buildKineticNeighbors = function () {
    var L = this.linkLayer.get('.linknodes');   
    L.each(function(node) {
        node.destroy();
        });
    L = this.nodeLayer.get('.picturenode');
    L.each(function(node) {
         node.destroy();
       });
    L = this.scrollLayer.get('.scrollbar');
    L.each(function(node) {
         node.destroy();
       });
    this.scrollLayer.removeChildren();
    this.tooltipLayer.removeChildren();
    this.linkLayer.setOffset(0,0);
    this.nodeLayer.setOffset(0, 0);
    this.ktcStage.removeChildren();
    this.hScrollBar = new ktcScrollbar(this, "horizontal", this.scrollLayer);
    this.vScrollBar = new ktcScrollbar(this, "vertical", this.scrollLayer);
    this.tooltipLayer.add(this.tooltip);
    var xc= this.ktcStage.getWidth() / 2;
    var yc= this.ktcStage.getHeight() / 2;
    var stepR = 80;
    var Ray = 100;
    var a = 0,x=0,y=0; sta=20;
    var r=100, RayF = Ray;
    for (var i=0; i<listNodes.length;i++) {
        if (listNodes[i].Type == 'Static PC Controller') {r = 40;
            x= xc;
            y= yc;
        } else {r=25;
            RayF = Ray + ((100 - (listNodes[i].ComQuality)) * 1.5);
            x= xc + RayF * Math.cos(a*Math.PI/180);
            y= yc + RayF * Math.sin(a*Math.PI/180);
            if (a > 330) { a = sta;
                sta = sta +20;
                Ray = Ray + stepR;
            } else { a= a + 40;
            };
        };
        listNodes[i].ktcNode = new KtcNode(x,y,r,listNodes[i],this.nodeLayer,this);
      };
    for (var id1=0; id1<listNodes.length;id1++)  {         
        for (var in1=0; in1<listNodes[id1].Neighbors.length;in1++) {
            for (var id2=0; id2<listNodes.length;id2++) {
                if (listNodes[id2].Node == listNodes[id1].Neighbors[in1]) { 
                    Link = new KtcLink(listNodes[id1].ktcNode, listNodes[id2].ktcNode, this.linkLayer);
                    break;
                };
            };
        };
    };
    
    this.ktcStage.add(this.linkLayer);        
    this.ktcStage.add(this.nodeLayer);
    this.ktcStage.add(this.tooltipLayer);
    this.ktcStage.add(this.scrollLayer);
};

KtcNeighborsGraph.prototype.getNodesCenter = function () {
    return this.nodeLayer.getOffset();
};

KtcNeighborsGraph.prototype.setNodesCenter = function (x, y) {
    this.linkLayer.setOffset(x,y);
    this.nodeLayer.setOffset(x, y);
    this.nodeLayer.batchDraw();
    this.linkLayer.batchDraw();
};

KtcNodeGrp = function  (x,y,r,node,layer,stage,grpAssociation) {
    this.pictNodeGrp = new Kinetic.Group({
          x: x,
          y: y,
          draggable: true,
          name : "nodegrp",
          nodeP : this
        });
    if (typeof(grpAssociation)=='undefined'){
        this.grpAss = layer;
        f ='yellow';
        } else {
        this.grpAss = grpAssociation; 
        f= 'pink';
        };
    this.pictureImg = new Kinetic.Circle({
        x: 0,
        y: 0,
        radius: r,
        fill: f,
        stroke: 'black',
        strokeWidth: 2,
        shadowColor: 'black',
        shadowBlur: 2,
        shadowOffset: 3,
        shadowOpacity: 0.5,
        name:"pictureImg"
        });
    this.text = new Kinetic.Text({
        x: -r +2,
        y: -5,
        width:2*r-4,
        text: "" + node.Node,
        fontSize: 16,
        fontFamily: "Calibri",
        fill: "black",
        align : "center"
    });
    var imgstate = new Image();
    this.imgstate = imgstate;
    this.state = 'unknown';
    this.pictNodeGrp.add(this.pictureImg);
    this.pictNodeGrp.add(this.text);
    var grp = this.pictNodeGrp;
    this.imgstate.onload = function() { 
        if (!this.init) {var st = new Kinetic.Image({
            x: -r-16,
            y: -r-16,
            image: imgstate,
            width: 32,
            height: 32,
            name: 'stateImg',
            visible: false
        });
        this.init = true;
        grp.add(st);
        grp.attrs.nodeP.kImg = st;
        };
    };
    this.imgstate.src =  '/design/common/images/status/check_32.png'; // pour l'init
    this.xOrg = x;
    this.yOrg = y;
    this.rOrg = r;
    this.nodeObj = node;
    this.layer = layer;
    this.state = 'unknown'; 
    var self = this;
    setTimeout(function () {
            if (self.grpAss == grpAssociation) {
            for (var i = 0; i<self.grpAss.grpAss.members.length; i++){
                 if (self.nodeObj.Node == self.grpAss.grpAss.members[i].id){
                    self.setimgstate(self.grpAss.grpAss.members[i].status, self.kImg);
                    break;
                 };
             };
             self.layer.draw();
         };}, 300, self , grpAssociation);   


    this.pictNodeGrp.on("mouseover touchstart", function() {
        var img = this.get(".pictureImg");
        if (this.attrs.nodeP.isMember()) {img[0].setFill("red");
        }else {img[0].setFill("blue");};
        img[0].setOpacity(0.5);
        this.parent.draw();
        document.body.style.cursor = "pointer";
        });

    this.pictNodeGrp.on("mouseout touchend", function() {
        var stage = this.getStage();
        var img = this.get(".pictureImg");
        if (img.length != 0) { // le node detruit genère quand même un mouseout après sa destruction
            if (this.attrs.nodeP.isMember()) {img[0].setFill("pink");
            } else {img[0].setFill("yellow");};
            stage.tooltip.hide();
            img[0].setOpacity(1);
            this.parent.draw();
            stage.tooltipLayer.draw();
            document.body.style.cursor = "default";
        } else {
            console.log("Persistance node remove");};
    });

    this.pictNodeGrp.on("dragstart", function() {
        var stage = this.getStage();
        console.log("dragstart node :" + this.attrs.nodeP.nodeObj.Node);
        var newstate = 'unallowable';
        if (!this.attrs.nodeP.isMember()) {
            this.attrs.nodeP.duplicateIt()
            newstate = this.state;};
        this.attrs.nodeP.setState(newstate);        
        this.parent.moveToTop();
        this.moveToTop();         
    });

    this.pictNodeGrp.on("dragmove", function() {
        var stage = this.getStage();
        var groups = stage.get('.ngroupass');
        var pos = this.getAbsolutePosition();    
        var inGrp = this.attrs.nodeP.inGroup();
        if (!this.attrs.nodeP.isMember()) {
            if (inGrp){
                this.setScale(0.8,0.8);
                this.attrs.nodeP.setState('add', inGrp.attrs.grpAssP);
            } else {
                this.setScale(1,1);
                this.attrs.nodeP.setState('unallowable');
            };
        } else {
             if (inGrp ){
                this.attrs.nodeP.setState('to update', inGrp.attrs.grpAssP);
            } else {
                this.attrs.nodeP.setState('del');
            };
        };
        this.moveToTop();         
        stage.draw();
    });

    this.pictNodeGrp.on("dragend", function() {
        var stage = this.getStage();
        console.log("dragend node :" + this.attrs.nodeP.nodeObj.Node);
        var inGrp = this.attrs.nodeP.inGroup();
        if (!this.attrs.nodeP.isMember()) {
            if (!inGrp){
                this.removeChildren();
                console.log("Hors d'un groupe, destruction de la copie.");
                delete(this.attrs.nodeP);
                delete(this);
            }else {
                console.log('dans un groupe, ajouter au groupe si pas doublon.');
                if (inGrp.attrs.grpAssP.addNode(this.attrs.nodeP)) {
                    this.attrs.nodeP.grpAss =inGrp.attrs.grpAssP;
                    this.attrs.nodeP.setState('to update');
                    inGrp.attrs.grpAssP.nodeArea.add(this);
             //       inGrp.attrs.grpAssP.refreshText();
                } else {
                    console.log('En doublons, suppression de la copie');
                    this.removeChildren();           
                    delete(this.attrs.nodeP);
                    delete(this);
                };
            };
        } else {
            if ((inGrp==null) || (inGrp.attrs.grpAssP != this.attrs.nodeP.grpAss)){
                this.attrs.nodeP.grpAss.delNode(this.attrs.nodeP);
            //    inGrp.attrs.grpAssP.refreshText();
                this.removeChildren();
                console.log('Hors du groupe, node retiré du group et détruit');
            }else {
                console.log('toujours dans le groupe, remis à sa place.');
                this.setPosition({x:this.attrs.nodeP.xOrg,y:this.attrs.nodeP.yOrg});
                };
            };        
        stage.draw();         
    });

    this.pictNodeGrp.on("mousedown", function() {
        console.log("mousedown node :" + this.attrs.nodeP.nodeObj.Node);
        if (this.attrs.nodeP.isMember()) {
            console.log("move node outside to exclude it");
        };
        this.moveToTop();         
    });

    this.pictNodeGrp.on("mousemove touchmove", function(){
        var stage = this.getStage();
        var mousePos = stage.getMousePosition();
        stage.tooltip.setPosition(mousePos.x + 5, mousePos.y + 5);
        var t = getLabelDevice(this.attrs.nodeP.nodeObj)
        t = t+ '\n' + this.attrs.nodeP.nodeObj.Type;
        stage.tooltip.setText(t);
        stage.tooltip.show();
        stage.tooltipLayer.draw();
    });
    this.layer.add(this.pictNodeGrp); 
};

KtcNodeGrp.prototype.isMember = function() {
    if (this.grpAss == this.layer) { return null;
    } else { return this.grpAss;};
};

KtcNodeGrp.prototype.inGroup = function() {
    var stage = this.pictNodeGrp.getStage();
    var groups = stage.get('.ngroupass');
    var retval = null, isSelf=-1;
    var pos = this.pictNodeGrp.getAbsolutePosition();
    var gPos, gSize;
        for (var i=0; i< groups.length; i++) {
            var gPos = groups[i].getAbsolutePosition();
            var gSize = groups[i].getSize();
            if (pos.x >= gPos.x && pos.x <= gPos.x + gSize.width && pos.y >= gPos.y && pos.y <= gPos.y + gSize.height) {
                retval = groups[i];
                break;
            };  
        };
    return retval;
};

KtcNodeGrp.prototype.duplicateIt = function() {
    var x = this.pictNodeGrp.getX(), y = this.pictNodeGrp.getY();
    var r = this.pictureImg.getRadius().x;
    var stage = this.pictNodeGrp.getStage();
    var n = new KtcNodeGrp(this.xOrg, this.yOrg, this.rOrg, this.nodeObj ,stage.elemsLayer,stage);
    stage.draw();
};

KtcNodeGrp.prototype.setimgstate = function(state, img) {
    if (this.state != state) {
        this.state = state;
        switch (state) {
            case mbrGrpSt[0] : // 'unknown' 
                this.imgstate.src =  '/design/common/images/status/unknown_red_32.png';
                if (img) {img.show();};
                break;
            case mbrGrpSt[1] : // 'confirmed' 
                this.imgstate.src = '/design/common/images/status/check_32.png';
                if (img) {img.hide();};
                break;
            case mbrGrpSt[2] : //'to confirm'
                this.imgstate.src =  '/design/common/images/status/unknown_green_32.png';
                if (img) {img.show();};
                break;
            case mbrGrpSt[3] : //'to update'
                this.imgstate.src =  '/design/common/images/action/refresh_16.png';
                if (img) {img.show();};
                break;
            case 'add':
                this.imgstate.src =  '/design/common/images/action/plus_32.png';
                if (img) {img.show();};
                break;
            case 'del':
                this.imgstate.src = '/design/common/images/action/minus_32.png';
                if (img) {img.show();};
                break;
             case 'unallowable':
                this.imgstate.src =  '/design/common/images/status/wrong_32.png';
               if (img) { img.show();};
                break;
        };
    };
};

KtcNodeGrp.prototype.setState = function(state, inGrpAss) {
     var img = this.kImg;
     if (img) { // le node detruit genère quand même un move event après sa destruction;
         var zstate = state, stOrg = false;
         var isMember = (this.grpAss != this.layer);
         if (isMember) {
             for (var i = 0; i<this.grpAss.grpAss.members.length; i++){
                 if (this.nodeObj.Node == this.grpAss.grpAss.members[i].id){
                    zstate = this.grpAss.grpAss.members[i].status;
                     stOrg  = true;
                    break;
                 };
             };
         };
         var isAMember = null;
         if (inGrpAss) {isAMember = inGrpAss.isAMember(this.nodeObj);};
         switch (state) {
            case 'add':
                if (isAMember || (inGrpAss.members.length >= inGrpAss.grpAss.maxAssociations)) {
                    this.setimgstate('unallowable', img);
                }else {this.setimgstate('add', img);};
                break;
            case 'del':
                this.setimgstate('del',img);
                break;
            case 'unallowable':
                this.setimgstate('unallowable',img);
                break;
            case 'to update':
                if (isAMember || stOrg) {this.setimgstate(zstate, img);
                } else {this.setimgstate('to update', img);};
                break;
       };
    } else {
         console.log("setState sur node persistant") ;
    };
};
// Groups associations

function stageGrps(contName) {
    var width = 650, height= 570;
    $('#'+ contName).width(width).height(height);
    grpsStage = null;
    if (grpsStage) {
        grpsStage.reset();
        grpsStage.clear();
    } else { 
          grpsStage = new Kinetic.Stage({
          container: contName,
          width: width,
          height: height
        });
    };
    grpsStage.tooltip = new Kinetic.Text({
        text: "essais",
        fontFamily: "Calibri",
        fontSize: 12,
        padding: 15,
        fill: "black",
        opacity: 1,
        visible: false
    });
    grpsStage.tooltipLayer = new Kinetic.Layer();
    grpsStage.tooltipLayer.add(grpsStage.tooltip);
    grpsStage.grpsLayer = new Kinetic.Layer();
    grpsStage.elemsLayer = new Kinetic.Layer();
    grpsStage.carouLayer = new Kinetic.Layer();
    grpsStage.add(grpsStage.grpsLayer);
    grpsStage.add(grpsStage.carouLayer);
    grpsStage.add(grpsStage.elemsLayer);    
    grpsStage.add(grpsStage.tooltipLayer);
    return grpsStage;
};

function getFreePosGrp(tabN) {
    var retval = -1;
    for (i=0; i<tabN.length;i++){
        if (!tabN[i].kN) {
            retval = i;
            break;
        };
    };
    return retval;
};

KtcGrpAss = function (x,y,w, maxLi, grp,stage) {
    var nbCol = 3, hHead = 50, r = 25;
    this.nbLi = Math.ceil(grp.maxAssociations / nbCol);
    if (this.nbLi > maxLi) {this.dispLi = maxLi; var scrolled = true;  var sColor = "#90C633";
    } else { this.dispLi = this.nbLi; var scrolled = false;  var sColor = "#669966";};
    this.LiStep = 2*r +10;
    var h= hHead + (this.dispLi * this.LiStep) + 10;
    w = 10+ (nbCol * this.LiStep) + 10;
    this.tabN=[];
    for (var i=0; i < this.nbLi; i++){
        for (var ii=0; ii< nbCol;ii++){
            this.tabN.push({x: 5+ (ii * this.LiStep) + r, y: (i * this.LiStep) + r  + 5, kN: null});
        };
    };
    this.picture = new Kinetic.Group({
        x: x,
        y: y,
        width: w,
        height: h,
        draggable: false,
        name : "ngroupass",
        grpAssP : this,
        });
    this.fondImg = new Kinetic.Rect({
        x: 0,
        y: 0,
        width: w,
        height: h,
        fillLinearGradientStartPoint: [0, 0],
        fillLinearGradientEndPoint: [0, h],
        fillLinearGradientColorStops: [0, '#BDCB2F', 1, '#D3F0A1'],
        shadowColor: 'black',
        shadowBlur: 2,
        shadowOffset: 5,
        shadowOpacity: 0.5,
        stroke: 'black',
        strokeWidth: 3,
        name:"fondGrp"
        });
    var strmembers = '', sp='';
    for (var i in grp.members) {
        strmembers += sp + grp.members[i].id ;
        sp=', ';
    };
    this.text = new Kinetic.Text({
        x: 3,
        y: 3,
        text: "Group " + grp.index + ", " + grp.label + "\n Max members : "+grp.maxAssociations + "\n Members : " + strmembers,
        fontSize: 12,
        fontFamily: "Calibri",
        fill: "black",
        align : "left"
    });

    this.nodeArea = new Kinetic.Group({
        x: x,
        y: y+hHead,
        width: w,
        height: h - hHead,
        draggable: false,
        name : "nodeArea" + grp.index,
        clipFunc: function(canvas) {
            var context = canvas.getContext();
            context.rect(5, 0, w-10, h - hHead-5);
        }
    });    
 // vertical scrollbars

    var wsc = 10;
    this.vscrollArea = new Kinetic.Rect({
        x: w - wsc,
        y: hHead,
        width: wsc,
        height: h - hHead,
        fill: "black",
        opacity: 0.3,
        name: 'scrollarea'+ grp.index
    });
    var hs = (h - hHead) / (this.nbLi - this.dispLi + 1);
    this.vscroll = new Kinetic.Rect({
        x: w - wsc,
        y: hHead,
        width: wsc,
        height: hs,
        fill: sColor,
        draggable: true,
        clearBeforeDraw: true,
        dragBoundFunc: function(pos) { // verticale
            var yA = this.area.getAbsolutePosition().y;
            var newY = yA;
            var h = this.area.getHeight();
            var hs = this.getHeight();
            if ((pos.y > yA) && ( pos.y <= h + yA - hs)) { 
                newY = pos.y;
            } else if (pos.y >  h + yA - hs) {
                newY =  h+yA - hs;
            };
            var offset = this.nodeArea.getOffset();
            var stepS = h / (this.parent.grpAss.nbLi - this.parent.grpAss.dispLi + 1);
            var ratio = (newY - yA) / stepS;
            var yOffset = this.parent.grpAss.LiStep * ratio ;
            this.nodeArea.setOffsetY(yOffset);
            this.nodeArea.getParent().draw();
            return {
                x: this.getAbsolutePosition().x,
                y: newY
            };
        },
        opacity: 0.9,
        stroke: "black",
        strokeWidth: 1,
        name: 'scrollbar'+ grp.index
    });
    this.vscroll.area = this.vscrollArea;
    this.vscroll.vscrollArea = this.vscrollArea;
    this.vscroll.nodeArea = this.nodeArea;
    this.stage = stage;
 // scrollbars events assignation
    if (scrolled) {
        this.vscroll.on("mouseover touchstart", function() {
            document.body.style.cursor = "pointer";
        });
        this.vscroll.on("mouseout touchend", function() {
            document.body.style.cursor = "default";
        });
        this.vscroll.on("dragstart", function() {
            this.parent.grpAss.showAll();
        });
    
        this.vscroll.on("dragend", function() {
            document.body.style.cursor = "default";
            this.parent.grpAss.clipArea();
        });
    };
    this.scrollbar = new Kinetic.Group();
    this.scrollbar.grpAss = this;
    this.scrollbar.add(this.vscrollArea);
    this.scrollbar.add(this.vscroll);
    this.grpAss = grp;
    this.layer = stage.grpsLayer;
    this.picture.add(this.fondImg);
    this.picture.add(this.text);
    this.picture.add(this.scrollbar);
    this.layer.add(this.picture);
    this.layer.add(this.nodeArea);    
    this.members = [];
    var m;
    for (i=0; i < grp.members.length; i++){
        posm = getFreePosGrp(this.tabN);
        m = new KtcNodeGrp(this.tabN[posm].x,this.tabN[posm].y,r,GetZWNodeById(grp.members[i].id),stage.grpsLayer,stage,this);
        this.tabN[posm].kN = m;
        this.members.push(grp.members[i]);
        this.nodeArea.add(m.pictNodeGrp);
    };
};

KtcGrpAss.prototype.clipArea = function() {
    var offset= this.nodeArea.getOffset().y;
    var size = this.nodeArea.getSize().height;
    var hHead = this.vscrollArea.getY();
    var r;
    var stepS = size / (this.nbLi - this.dispLi + 1);
    var step = Math.round(offset / this.LiStep);
    offset = step * this.LiStep;
    this.nodeArea.setOffsetY(offset);
    this.vscroll.setY((step *  stepS) + hHead);
    for (i=0; i < this.tabN.length; i++){
        if (this.tabN[i].kN) {
            r = this.tabN[i].kN.pictureImg.attrs.radius;
            if (offset > this.tabN[i].y - r/2 || this.tabN[i].y + r > offset + size) {
                this.tabN[i].kN.pictNodeGrp.hide();
            } else {
                this.tabN[i].kN.pictNodeGrp.show();
            };
        };
    };
    this.layer.draw();
};

KtcGrpAss.prototype.showAll = function() {
    for (i=0; i < this.tabN.length; i++){
        if (this.tabN[i].kN) {this.tabN[i].kN.pictNodeGrp.show();};
        };
    this.layer.draw();
};

KtcGrpAss.prototype.refreshText = function (){
    var strmembers = '', sp='';
    for (var i in this.members) {
        strmembers += sp + this.members[i].id ;
        sp=', ';
    };
    this.text.setText("Group " + this.grpAss.index + ", " + this.grpAss.label + "\n Max members : "+ this.grpAss.maxAssociations + "\n Members : " + strmembers);
    this.layer.draw();
};
    

KtcGrpAss.prototype.getDim = function (){
    var retval={};
    retval.pos=this.picture.getPosition();
    retval.size= this.picture.children[0].getSize(); // pas de getsize sur contenair en lib v3.10
    return retval;
};

KtcGrpAss.prototype.isAMember = function (nodeObj) {
    var retval = null;
    for (var i=0; i<this.members.length; i++) {
        if (this.members[i].id == nodeObj.Node) { 
            retval = this.members[i];
            break;
            };
    };
    return retval
};

KtcGrpAss.prototype.addNode = function (kNode) {
    if (!this.isAMember(kNode.nodeObj)) {
        if (this.members.length<this.grpAss.maxAssociations) {
            var state = 'to update';
            for (var i = 0; i<this.grpAss.members.length; i++){
                if (kNode.nodeObj.Node == this.grpAss.members[i].id){
                state = this.grpAss.members[i].status;
                break;
                };
            }; 
            this.members.push({id:kNode.nodeObj.Node, status: state});
            var posm = getFreePosGrp(this.tabN);
            if (posm!=-1) {
                this.tabN[posm].kN = kNode;
                kNode.pictNodeGrp.moveTo(this.picture);
                kNode.pictNodeGrp.setPosition({x:this.tabN[posm].x, y:this.tabN[posm].y});
                kNode.xOrg = this.tabN[posm].x;
                kNode.yOrg = this.tabN[posm].y;
            this.refreshText();
            return true;
            } else {
                console.log ("Plus de place disponible, pas d'ajout");
                return false};                
        }else { 
            console.log ("Nombre max atteint, pas d'ajout");
            return false};
    } else { return false;};
};

KtcGrpAss.prototype.delNode = function (kNode) {
    var idx =-1;
    if (kNode.nodeObj) {
        for (var i =0; i< this.members.length; i++) {
            if (this.members[i].id == kNode.nodeObj.Node) {
                idx = i;
                break;
            };
        };
        if (idx != -1) {
            this.members.splice(idx, 1);
            for (var i=0; i<this.tabN.length;i++) {
                if (this.tabN[i].kN == kNode) {
                    this.tabN[i].kN = null;
                    break;
                };
            };
            this.refreshText();
            return true;
        } else { return false;};
    } else { //node ghost force delete it.
        for (var i=0; i<this.tabN.length;i++) {
            if (this.tabN[i].kN == kNode) {
                this.tabN[i].kN = null;
                break;
            };
        };
        for (var i =0; i< this.members.length; i++) { // check if node() exist and delete it from member list.
            if (GetZWNodeById(this.members[i].id) == false) {
                this.members.splice(i, 1);
            };
        };
        this.refreshText();
        return true;
    };
};

function ResetGroups(stage, nodeP) {
    console.log("reset intial groups");
};

function initGoAction (go) {
    go.on('mouseover touchstart', function() {      
        var stage = this.getStage();
        document.body.style.cursor = "pointer";
        this.setOpacity(0.5);
        this.attrs.anim.start();
        stage.carouLayer.speed = 1;
        this.attrs.layer.draw();
        });
    go.on('mouseout touchend', function() {
        var stage = this.getStage();
        document.body.style.cursor = "default";
        this.setOpacity(1);
        this.attrs.anim.stop();
        stage.carouLayer.speed = 1;
        this.attrs.layer.draw();
    });
    go.on('click', function() {
        var stage = this.getStage();
       // var x = stage.elemsLayer.getX();
        this.attrs.anim.stop();
        stage.carouLayer.speed = 1;
        this.setOpacity(1);
        this.attrs.layer.draw();
    });
};

KtcInitCarouselNodes = function (r, wArea, stage) {
    var hArea = 2*r + 10;
    var maxSpeed = 60;
    var bgCoul = $('#divNodeAssDialog').css("background-color");
    var bord1 = new Kinetic.Rect({
        x: 0,
        y: 0,
        width: hArea,
        height: hArea,
        fill: bgCoul,
        opacity: 1
    });
    var bord2 = new Kinetic.Rect({
        x: stage.getWidth() - hArea,
        y: 0,
        width: hArea,
        height: hArea,
        fill: bgCoul,
        opacity: 1
    });
    this.wArea = wArea;
    this.layer = stage.carouLayer;
    this.layer.add(bord1);
    this.layer.add(bord2);
    this.imgGoLeft = new Image();
    var img = this.imgGoLeft;
    var layer = this.layer;
    this.imgGoLeft.onload = function () {
        var goL = new Kinetic.Image({
            x: 0,
            y: 0,
            image: img,
            width: 64,
            height: 64,
            name:  'left',
            visible: true,
            layer: layer,
            anim: new Kinetic.Animation(function(frame) {
                    var offset = stage.elemsLayer.getOffset();
                    var x = offset.x;
                    if (frame.timeDiff != 0) {x = offset.x - ((frame.timeDiff * stage.carouLayer.speed)/100);};
                    if (x <= -wArea) { x = wArea;};
                    stage.elemsLayer.setOffset(x,offset.y);
                    stage.carouLayer.moveToTop();
                    if (stage.carouLayer.speed < maxSpeed) { stage.carouLayer.speed = stage.carouLayer.speed + (10 / (frame.frameRate+10)) ;};
                  }, stage.elemsLayer)
        });
        initGoAction(goL);
        layer.add(goL);
        layer.draw();
    };
    this.imgGoLeft.src =  '/design/common/images/action/go_left_64.png';      
    this.imgGoRight = new Image();
    var imgR = this.imgGoRight;
    this.imgGoRight.onload = function () {
        var goR = new Kinetic.Image({
            x: stage.getWidth() - 64,
            y: 0,
            image: imgR,
            width: 64,
            height: 64,
            name:  'right',
            visible: true,
            layer: layer,
            anim: new Kinetic.Animation(function(frame) {
                    var offset = stage.elemsLayer.getOffset();
                    var x = offset.x;
                    if (frame.timeDiff != 0) {x = offset.x + ((frame.timeDiff * stage.carouLayer.speed)/100);};
                    if (x >= wArea) {x= -wArea;};
                    stage.elemsLayer.setOffset(x, offset.y);
                    stage.carouLayer.moveToTop();
                    if (stage.carouLayer.speed < maxSpeed) { stage.carouLayer.speed=stage.carouLayer.speed+(10 / (frame.frameRate+10));};
                  }, stage.elemsLayer)
        });
        initGoAction(goR);
        layer.add(goR);
        layer.draw();
    };
    this.imgGoRight.src =  '/design/common/images/action/go_right_64.png'; 
};


function RefreshGroups(stage, nodeP, newGroups) {
    console.log("Refresh state members groups");
    var groups = stage.get('.ngroupass');
    for (var grp= 0; grp < groups.length; grp++) {
        for (var gn in newGroups) {
            if (groups[grp].attrs.grpAssP.grpAss.index == newGroups[gn].idx) {
                for (var m in  groups[grp].attrs.grpAssP.tabN) {
                    if (groups[grp].attrs.grpAssP.tabN[m].kN) {
                        for (var mn =0; mn< newGroups[gn].mbs.length; mn++){
                           if (groups[grp].attrs.grpAssP.tabN[m].kN.nodeObj.Node == newGroups[gn].mbs[mn].id) {
                               var img = groups[grp].attrs.grpAssP.tabN[m].kN.kImg;
                               groups[grp].attrs.grpAssP.tabN[m].kN.setimgstate(newGroups[gn].mbs[mn].status, img);
                               break;
                           };
                        };
                    };
               };
                break;
            };
        };
    };
    stage.draw();
}; 

function calculateDimGrps(nbColGrp, nbLiGrp, groups, hSize) {
    var nbCol = 3, hHead = 50, r = 25;
    var stepN = 2*r +10;
    var hb= hHead + 10;
    var sum, nl, ratio, size;
    var mSize = 0;
    var tabCol = new Array();
    for (var i= 0; i < nbColGrp; i++) {
        tabCol.push(new Array());
        for (var ii= 0; ii < nbLiGrp; ii++){tabCol[i].push(0);};
    };
    for (var cptCol = 0; cptCol < nbColGrp; cptCol++){
        sum = 0;
        nl =0;
        for (var cptLi = 0; cptLi < nbLiGrp; cptLi++){
            gi = cptCol + (nbColGrp * cptLi);
            if (gi < groups.length) {
                tabCol[cptCol][cptLi] = Math.ceil(groups[gi].maxAssociations / nbCol); // addition le nombre de lignes necessaire)
                sum += tabCol[cptCol][cptLi] ;
                nl++;
            };
        };
        size = nl * hb + sum * stepN;
        ratio = (hSize/ size);
        if (ratio >= 1) {ratio = 1;
        } else {size = Math.ceil(size * ratio);};
        size = 0;
        for (var cptLi = 0; cptLi < nbLiGrp; cptLi++){
            tabCol[cptCol][cptLi] = Math.floor(tabCol[cptCol][cptLi] * ratio);
            size += tabCol[cptCol][cptLi] * stepN + hb;
        };
        if (size > mSize) {mSize = size;};
    };
    return {'tabCol': tabCol, 'maxS': mSize};
};

function CreateGroups(stage, nodeP, st_design_url, idDiv) {
    var wn = 60, hn = 60;
    var w = stage.getWidth()-10;
    var h = stage.getHeight()-10;
    var r =  Math.floor((wn-4) / 2);
    var wg = 200; //, hg = 250;
    var spw = 10, sph = 10;
    var nbcol=0, nbli=0;
    if (nodeP.Groups.length *(wg+spw) <w){
         nbcol= nodeP.Groups.length;
         nbli = 1;
    } else {  
         nbcol = Math.floor(w / (wg+spw));
         nbli = Math.ceil(nodeP.Groups.length / nbcol);
    };
    var result = calculateDimGrps(nbcol, nbli, nodeP.Groups, h-(2*r + 40));
    var tabCol = result['tabCol'];
    var maxS = result['maxS'] + (2*r + 40);
    if (maxS < h) {
        stage.setHeight(maxS);
        var hDiv = $('#'+idDiv).height();
        var NewH = hDiv - (h-maxS);
        $('#'+idDiv).height(NewH)};
    var ccol = -1, cli =0, x=0,y= 5;
    var imgGrp;
    var dimGrps = new Array();
    for (var gi=0; gi < nodeP.Groups.length; gi++) {
        if (ccol == nbcol-1) {
            ccol =0; 
            y = dimGrps[ccol][cli].pos.y + dimGrps[ccol][cli].size.height + sph;
            cli++;
        } else {
            ccol++;
            if (cli == 0) {dimGrps[ccol] = new Array();
            } else {
                dimGrps[ccol].push({});
                y = dimGrps[ccol][cli].pos.y + dimGrps[ccol][cli].size.height + sph;
            };
        }; 
        x= (ccol * (wg+spw)) + 15;
  //      y= (cli * (hg+sph)) + 15;
        imgGrp = new KtcGrpAss(x,y,wg,tabCol[ccol][cli],nodeP.Groups[gi], stage);
        dimGrps[ccol][cli] = imgGrp.getDim();
        
    };
    ccol = 0;
    var yCarou = stage.getHeight() - (2*r+10);
    stage.carouLayer.setY(yCarou);
    stage.elemsLayer.setPosition(64, yCarou);
    stage.elemsLayer.setWidth(w - 128);
    for (var ni=0; ni < listNodes.length; ni++) {
        if (listNodes[ni].Node != nodeP.Node) {
            x = (ccol * (wn+spw)) + r + 4;
            y = r + 5,
            new KtcNodeGrp(x,y,r,listNodes[ni] ,stage.elemsLayer,stage);
            ccol++;
        };
    };
    stage.carouLayer.speed = 1;
    KtcInitCarouselNodes(r, x+r+4, stage)
    stage.draw();
};

function SetNewGroups (stage, node) {
    console.log('get new grp for sending');
    var groups = stage.get('.ngroupass');
    for (var gnew= 0; gnew < groups.length; gnew++) {
        for (var g in node.Groups) {
            if (groups[gnew].attrs.grpAssP.grpAss.index == node.Groups[g].index) {
                node.Groups[g].members = groups[gnew].attrs.grpAssP.members;
                break;
            };
        };
    };

    return node.Groups;
};

