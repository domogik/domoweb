// libairie pour représentation du voisinage et association groupe de device zwave
var nborsStage, grpsStage;
var areas, scrollbars;
var nodeLayer, linkLayer, scrollLayer, tooltipLayer;
var tooltip;

function getLabelDevice(node) {
    if (node.Name != "Undefined" && node.Name !="") {
        return node.Name + '\n(' + node.Node +')';
    } else {
        return "Node " + node.Node;
    };
};

KtcNodeNeighbor = function  (x,y,r,node,layer,stage) {
    this.nodeobj = node;
    this.pictNodeNeig = new Kinetic.Group({
          x: x,
          y: y,
          draggable: true,
          name: 'nodeneighbor',
          nodeP : this
        });
    var op =1;
    if (this.nodeobj['State sleeping']) {op = 0.3; };
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
        nodeP : this
        });
    var t = getLabelDevice(node);
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
    this.pictNodeNeig.add(this.pictureImg);
    this.pictNodeNeig.add(this.text);
    this.links = new Array ();
    this.layer = layer;
    this.pictNodeNeig.on("mouseover touchstart", function() {
        var img = this.get(".pictureImg");
        img[0].setFillRadialGradientColorStops([0, 'turquoise', 1, 'blue']);
        img[0].setOpacity(0.5);
        this.parent.draw();
        document.body.style.cursor = "pointer";
        });

    this.pictNodeNeig.on("mouseout touchend", function() {
        var img = this.get(".pictureImg");
        img[0].setFillRadialGradientColorStops(this.attrs.nodeP.getColorState());
        tooltip.hide();
        var op =1;
        if (this.attrs.nodeP.nodeobj['State sleeping']) {op = 0.3; };
        img[0].setOpacity(op);
        this.parent.draw();
        tooltipLayer.draw();
        document.body.style.cursor = "default";
    });

    this.pictNodeNeig.on("dragmove", function() {
      for (var i=0; i<this.attrs.nodeP.links.length;i++) {
          this.attrs.nodeP.links[i].follownode(this.attrs.nodeP);
      };
      this.moveToTop();         
    });
    this.pictNodeNeig.on("mousemove", function(){
        var mousePos = stage.getMousePosition();
        tooltip.setPosition(mousePos.x + 5, mousePos.y + 5);
        var t = this.attrs.nodeP.nodeobj.Type + ', Quality : ' + this.attrs.nodeP.nodeobj.ComQuality + '%';
        for (var i=0; i<this.attrs.nodeP.nodeobj.Groups.length; i++) {
            if (this.attrs.nodeP.nodeobj.Groups[i].members.length !==0) {
                t = t+ '\n associate with node : ';
                for (var ii=0; ii<this.attrs.nodeP.nodeobj.Groups[i].members.length; ii++) {
                    t= t  + this.attrs.nodeP.nodeobj.Groups[i].members[ii].id+ ',';
                };
            } else {
             t = t+ '\n no association ';
            };
            t = t + ' in index ' + this.attrs.nodeP.nodeobj.Groups[i].index + ' named :' + this.attrs.nodeP.nodeobj.Groups[i].label;
        };
        tooltip.setText(t);
        tooltip.show();
        tooltipLayer.draw();
        mousePos=0;
    });
    this.layer.add(this.pictNodeNeig); 
};

KtcNodeNeighbor.prototype.addlink = function(linker) {
    var idx = this.links.indexOf(linker);
    if (idx == -1) {
        this.links.push(linker);
        linker.addnode(this);
    };
};               

KtcNodeNeighbor.prototype.removelink= function(linker) {
    var idx = this.links.indexOf(linker);
    if (idx == -1) {
        this.links[idx].destroy();
        this.links.splice(idx, 1);
        linker.draw();
    };
};

KtcNodeNeighbor.prototype.checklinks= function() {
    var idn = -1;
    for (var idx in this.links) {
        if (this.links[idx].nodes[1].nodeobj.Node != this.nodeobj.Node) {
            idn = this.nodeobj.Neighbors.indexOf(this.links[idx].nodes[1].nodeobj.Node);
            if (idn == -1) { // Link must me removed
                this.links[idx].destroy();
                this.links.splice(idx, 1);
            };
        };
    };
    var create = true;
    for (idn in this.nodeobj.Neighbors) {
        create = true;
        for (idx in this.links) {
            if (this.links[idx].nodes[1].nodeobj.Node == this.nodeobj.Neighbors[idn]) {
                create = false;
                break;
            };
        };
        if (create) {
            N2 = GetZWNodeById(this.nodeobj.Neighbors[idn]);
            if (N2) {new Clink(this, N2.ktcNode, linkLayer);};
        };
    };
    linkLayer.draw();
};

KtcNodeNeighbor.prototype.getColorState = function() {
    var colors = [0, 'yellow', 0.5, 'orange', 1, 'blue'];
    switch (this.nodeobj['InitState']) {
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

KtcNodeNeighbor.prototype.getTypeLink = function(Node2) {
    var indice = 1, color = 'green';
    if (this.nodeobj.Capabilities.indexOf("Primary Controller" ) != -1 ) { indice =8;  color ='blue'}
    if (this.nodeobj.Capabilities.indexOf("Routing") != -1) {indice = indice + 2;}
    if (this.nodeobj.Capabilities.indexOf("Beaming" ) != -1) {indice = indice + 1;}
    if (this.nodeobj.Capabilities.indexOf("Listening" ) != -1) { indice = indice + 3;}
    if (this.nodeobj.Capabilities.indexOf("Security") != -1) { color ='yellow';}
    if (this.nodeobj.Capabilities.indexOf("FLiRS") != -1) { indice = indice + 2;}
    if (this.nodeobj['State sleeping']) {indice = indice -2; color = 'orange';}
    if (this.nodeobj['InitState'] == 'Out of operation') {indice = 1,  color = 'red';}
    return {'indice' : indice, 'color' : color}
};

KtcNodeNeighbor.prototype.update = function() {
    this.checklinks();
    this.pictureImg.setFillRadialGradientColorStops(this.getColorState());
    tooltip.hide();
    var op =1;
    if (this.nodeobj['State sleeping']) {op = 0.3; };
    this.pictureImg.setOpacity(op);
    for (var l in this.links)  {this.links[l].update();};
    this.pictNodeNeig.draw();
    tooltipLayer.draw();
    console.log('redraw kinetic node :' + this.nodeobj.Node);
};

CLink = function (N1,N2,layer) {
            // build linelink
    var t = N1 .getTypeLink(N2);
    var x1 = N1.pictNodeNeig.getX(), y1 = N1.pictNodeNeig.getY();
    var x2 = N2.pictNodeNeig.getX(), y2 = N2.pictNodeNeig.getY();   
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
    var idx = this.nodes.indexOf(node);
    if (idx != -1) {
        this.nodes.splice(idx, 1);
        node.removenode(this);           
        this.layer.draw();
    };
};

CLink.prototype.asnode= function(node) {
    var id = this.nodes.indexOf(node);
    if (id1 != -1) {return true;
    }else {return false};
};
    
CLink.prototype.follownode = function(node) { 
    var id1 = this.nodes.indexOf(node);
    var id2 =0;
    if (id1 != -1) {
        if (id1 ==0) {id2 =1;};
        var p2 = this.nodes[id2].pictNodeNeig.getPosition();
        var p1 = node.pictNodeNeig.getPosition();
        var pm = { 'x' : (p2.x+ p1.x) /2, 'y' : (p2.y + p1.y) /2};
        this.link.attrs.points[id1] = p1;
        this.link.attrs.points[id2] = pm;
        if (id2 == 0) { this.link.attrs.points[id2] = pm;
            this.link.attrs.points[id1] = p2;
            } 
        this.layer.draw();
        }
};

CLink.prototype.update= function() {
    var t = this.nodes[0].getTypeLink(this.nodes[2]);
    this.link.setStrokeWidth (t['indice']);
    this.link.setStroke(t['color']);
    this.layer.draw();
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
function initScrollbars(stage) {
  //  horizontal scrollbars

    var hscrollArea = new Kinetic.Rect({
        x: 0,
        y: stage.getHeight() - 20,
        width: stage.getWidth() - 30,
        height: 20,
        fill: "black",
        opacity: 0.3,
        name: 'scrollbar'
    });

    var hscroll = new Kinetic.Rect({
        x: ((stage.getWidth()-30)/2) - 65,
        y: stage.getHeight() - 20,
        width: 130,
        height: 20,
        fill: "#90C633",
        draggable: true,
        dragBoundFunc: function(pos) { // horizontale
            var newX = 0;
            if ((pos.x > 0) && ( pos.x < stage.getWidth() - 160)) { 
                newX = pos.x;
            } else if (pos.x > (stage.getWidth() - 160)) {
                newX = stage.getWidth() - 160;
            };
            return {
                x: newX,
                y: this.getY() 
            };
        },
        opacity: 0.9,
        stroke: "black",
        strokeWidth: 1,
        name: 'scrollbar'
    });
 // vertical scrollbars
    var vscrollArea = new Kinetic.Rect({
        x: stage.getWidth() - 20,
        y: 0,
        width: 20,
        height: stage.getHeight() - 30,
        fill: "black",
        opacity: 0.3,
        name: 'scrollbar'
    });

    var vscroll = new Kinetic.Rect({
        x: stage.getWidth() - 20,
        y: ((stage.getHeight()-30)/2) - 35,
        width: 20,
        height: 70,
        fill: "#90C633",
        draggable: true,
        dragBoundFunc: function(pos) { // verticale
            var newY = 0;
            if ((pos.y > 0) && ( pos.y < stage.getHeight() - 100)) { 
                newY = pos.y;
            } else if (pos.y > (stage.getHeight() - 100)) {
                newY = stage.getHeight() - 100;
            };
            return {
                x: this.getX(),
                y: newY
            };
        },
        opacity: 0.9,
        stroke: "black",
        strokeWidth: 1,
        name: 'scrollbar'
    });
 // scrollbars events assignation
    scrollbars.on("mouseover touchstart", function() {
        document.body.style.cursor = "pointer";
    });
    scrollbars.on("mouseout touchend", function() {
        document.body.style.cursor = "default";
    });
    scrollLayer.on("beforeDraw", function() {
        var x = -1 * ((hscroll.getPosition().x + (hscroll.getWidth() /2)) - (hscrollArea.getWidth()/2));
        var y = -1 * ((vscroll.getPosition().y + (vscroll.getHeight() /2)) - (vscrollArea.getHeight()/2));
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
    //  hscroll.setDragBounds({left:0, right:(stage.getWidth() - 160)});
     };
};

function buildKineticNeighbors() {
        var L = linkLayer.get('.linknodes');   
        L.each(function(node) {
            node.destroy();
            });
        L = nodeLayer.get('.nodeneighbor');
        L.each(function(node) {
             node.destroy();
           });
        L = scrollLayer.get('.scrollbar');
        L.each(function(node) {
             node.destroy();
           });
        scrollLayer.removeChildren();
        tooltipLayer.removeChildren();
        nborsStage.removeChildren();
        initScrollbars(nborsStage);
        tooltipLayer.add(tooltip);
        nborsStage.removeChildren();  
        var xc= nborsStage.getWidth() / 2;
        var yc= nborsStage.getHeight() / 2;
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
            listNodes[i].ktcNode = new KtcNodeNeighbor(x,y,r,listNodes[i],nodeLayer,nborsStage);
          };
        for (var id1=0; id1<listNodes.length;id1++)  {         
            for (var in1=0; in1<listNodes[id1].Neighbors.length;in1++) {
                for (var id2=0; id2<listNodes.length;id2++) {
                    if (listNodes[id2].Node == listNodes[id1].Neighbors[in1]) { 
                        Link = new CLink(listNodes[id1].ktcNode, listNodes[id2].ktcNode, linkLayer);
                        break;
                    };
                };
            };
        };
        nborsStage.add(linkLayer);        
        nborsStage.add(nodeLayer);
        nborsStage.add(tooltipLayer);
        nborsStage.add(scrollLayer);
    };

function initNeighborsStage(){
    var cont = document.getElementsByClassName("subsection");
    var width = 810;
    for (var i=0; i < cont.length; i++) {
        if (cont[i].offsetWidth !== 0) {
            width = cont[i].offsetWidth - 30;
            break;
            };
        };
    nborsStage = new Kinetic.Stage({
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
        padding: 15,
        fill: "black",
        opacity: 1,
        visible: false
    });
    tooltipLayer = new Kinetic.Layer();
    buildKineticNeighbors();
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

window.onload = function() {
    var s= 0;
      }; 
