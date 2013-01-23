// libairie pour représentation du voisinage et association groupe de device zwave
var nborsStage, grpsStage;
var areas, scrollbars;
var nodeLayer, linkLayer, scrollLayer, tooltipLayer;
var tooltip;

function getLabelDevice(node) {
    if (node.Name != "Undefined" && node.Name !="") {
        return node.Name;
    } else {
        return "Node " + node.Node;
    };
};

KtcNodeNeighbor = function  (x,y,r,node,layer,stage) {
    this.pictNodeNeig = new Kinetic.Group({
          x: x,
          y: y,
          draggable: true,
          name: 'nodeneighbor',
          nodeP : this
        });
    this.pictureImg = new Kinetic.Circle({
        x: 0,
        y: 0,
        radius: r,
        fill: 'yellow',
        stroke: 'black',
        strokeWidth: 4,
        name:"pictureImg",
        nodeP : this
        });
    this.text = new Kinetic.Text({
        x: -r +2,
        y: -5,
        width:2*r-4,
        text: getLabelDevice(node),
        fontSize: 12,
        fontFamily: "Calibri",
        textFill: "black",
        align : "center"
    });
    this.pictNodeNeig.add(this.pictureImg);
    this.pictNodeNeig.add(this.text);
    this.links = new Array ();
    this.nodeobj = node;
    this.layer = layer;
    this.pictNodeNeig.on("mouseover", function() {
        var img = this.get(".pictureImg");
        img[0].setFill("blue");
        img[0].setOpacity(0.5);
        this.parent.draw();
        document.body.style.cursor = "pointer";
        });
            
    this.pictNodeNeig.on("mouseout", function() {
        var img = this.get(".pictureImg");
        img[0].setFill("yellow");
        tooltip.hide();
        img[0].setOpacity(1);
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
        var t = this.attrs.nodeP.nodeobj.Type;
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
        this.links.splice(idx, 1);
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
        x: N1.pictNodeNeig.getX(),
        y: N1.pictNodeNeig.getY()
      }, {
        x: N2.pictNodeNeig.getX(),
        y: N2.pictNodeNeig.getY()
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
CLink.prototype.follownode = function(node) { 
    var idx = this.nodes.indexOf(node);
    if (idx != -1) {
        this.link.attrs.points[idx] = node.pictNodeNeig.getPosition();
        this.layer.draw();
        }
};

CLink.prototype.draw= function() {
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
        strokeWidth: 4,
        name:"pictureImg"
        });
    this.text = new Kinetic.Text({
        x: -r +2,
        y: -5,
        width:2*r-4,
        text: "" + node.Node,
        fontSize: 16,
        fontFamily: "Calibri",
        textFill: "black",
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
        
   
    this.pictNodeGrp.on("mouseover", function() {
        var img = this.get(".pictureImg");
        if (this.attrs.nodeP.isMember()) {img[0].setFill("red");
        }else {img[0].setFill("blue");};
        img[0].setOpacity(0.5);
        this.parent.draw();
        document.body.style.cursor = "pointer";
        });
            
    this.pictNodeGrp.on("mouseout", function() {
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
                this.attrs.nodeP.removeIt();
                console.log("Hors d'un groupe, destruction de la copie.");
                delete(this.attrs.nodeP);
                delete(this);
            }else {
                console.log('dans un groupe, ajouter au groupe si pas doublon.');
                if (inGrp.attrs.grpAssP.addNode(this.attrs.nodeP)) {
                    this.attrs.nodeP.grpAss =inGrp.attrs.grpAssP;
                    this.attrs.nodeP.setState('to update');
                } else {
                    console.log('En doublons, suppression de la copie');
                    this.attrs.nodeP.removeIt();                    
                    delete(this.attrs.nodeP);
                    delete(this);
                };
            };
        } else {
            if ((inGrp==null) || (inGrp.attrs.grpAssP != this.attrs.nodeP.grpAss)){
                this.attrs.nodeP.grpAss.delNode(this.attrs.nodeP);
                this.attrs.nodeP.removeIt();
                console.log('Hors du groupe, node retiré du group et détruit');
                delete(this.attrs.nodeP);
                delete(this);
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
    var intercept;
        for (var i=0; i< groups.length; i++) {
            intercept = groups[i].getIntersections(pos);
            for (var ii=0;ii<intercept.length;ii++){
                isSelf = this.pictNodeGrp.children.indexOf(intercept[ii]);
                if (isSelf == -1) {
                    retval = groups[i];
                    break;
                };
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

KtcNodeGrp.prototype.removeIt = function() {
    var stage = this.pictNodeGrp.getStage();
    this.pictNodeGrp.removeChildren();
    this.pictNodeGrp.setListening(false);
    try {
        this.pictNodeGrp.remove();
    } catch (err){
        console.log('err sur removeit');
    };
    stage.draw();
};

KtcNodeGrp.prototype.setimgstate = function(state, img) {
    if (this.state != state) {
        this.state = state;
        switch (state) {
            case mbrGrpSt[0] : // 'unknown' 
                this.imgstate.src =  '/design/common/images/status/unknown_red_32.png';
                img.show();
                break;
            case mbrGrpSt[1] : // 'confirmed' 
                this.imgstate.src = '/design/common/images/status/check_32.png';
                img.hide();
                break;
            case mbrGrpSt[2] : //'to confirm'
                this.imgstate.src =  '/design/common/images/status/unknown_green_32.png';
                img.show();
                break;
            case mbrGrpSt[3] : //'to update'
                this.imgstate.src =  '/design/common/images/action/refresh_16.png';
                img.show();
                break;
            case 'add':
                this.imgstate.src =  '/design/common/images/action/plus_32.png';
                img.show();
                break;
            case 'del':
                this.imgstate.src = '/design/common/images/action/minus_32.png';
                img.show();
                break;
             case 'unallowable':
                this.imgstate.src =  '/design/common/images/status/wrong_32.png';
                img.show();
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
        opacity: 0.3
    });

    var hscroll = new Kinetic.Rect({
        x: ((stage.getWidth()-30)/2) - 65,
        y: stage.getHeight() - 20,
        width: 130,
        height: 20,
        fill: "#9f005b",
        draggable: true,
        dragBoundFunc: function(pos) { // horizontal
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
        strokeWidth: 1
    });
 // vertical scrollbars
    var vscrollArea = new Kinetic.Rect({
        x: stage.getWidth() - 20,
        y: 0,
        width: 20,
        height: stage.getHeight() - 30,
        fill: "black",
        opacity: 0.3
    });

    var vscroll = new Kinetic.Rect({
        x: stage.getWidth() - 20,
        y: ((stage.getHeight()-30)/2) - 35,
        width: 20,
        height: 70,
        fill: "#9f005b",
        draggable: true,
        dragBoundFunc: function(pos) { // horizontal
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
        nborsStage.reset();
        initScrollbars(nborsStage);
        tooltipLayer.add(tooltip);
        var xc= nborsStage.getWidth() / 2;
        var yc= nborsStage.getHeight() / 2;
        var stepR = 80;
        var Ray = 100;
        var a = 0,x=0,y=0; sta=20;
        var r=100;
        for (var i=0; i<listNodes.length;i++) {
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
        padding: 5,
        textFill: "white",
        fill: "black",
        opacity: 0.75,
        visible: false
    });
    tooltipLayer = new Kinetic.Layer();
    buildKineticNeighbors();
};

// Groups associations

function stageGrps(contName) {
    var width = 800, height= 570;
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
        padding: 5,
        textFill: "white",
        fill: "black",
        opacity: 0.75,
        visible: false
    });
    grpsStage.tooltipLayer = new Kinetic.Layer();
    grpsStage.tooltipLayer.add(grpsStage.tooltip);
    grpsStage.grpsLayer = new Kinetic.Layer();
    grpsStage.elemsLayer = new Kinetic.Layer();
    grpsStage.carouLayer = new Kinetic.Layer();
    grpsStage.add(grpsStage.grpsLayer);
//    grpsStage.carouLayer.add(grpsStage.elemsLayer);
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

KtcGrpAss = function (x,y,w,h,grp,stage) { 
    var nbCol = 3, hHead = 50, r = 25;
    var nbLi = Math.ceil(grp.maxAssociations / nbCol);
    pas = 2*r +10;
    h= hHead + (nbLi * pas) + 10;
    w = 10+ (nbCol * pas) + 10;
    this.tabN=[];
    for (var i=0; i < nbLi; i++){
        for (var ii=0; ii< nbCol;ii++){
            this.tabN.push({x:10+ (ii *pas) + r  + 5, y: hHead + (i *pas) + r  + 5, kN: null});
        };
    };
    this.picture = new Kinetic.Group({
            x: x,
            y: y,
            draggable: false,
            name : "ngroupass",
            grpAssP : this
        });
    this.pictureImg = new Kinetic.Rect({
        x: 0,
        y: 0,
        width: w,
        height: h,
        fill:{
            start: { x: 0, y: 10 },
            end: { x: 0, y: h-10 },
            colorStops: [0, '#BDCB2F', 1, '#9BB528']
          }, 
        stroke: 'black',
        strokeWidth: 3,
        name:"goupimg"
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
        textFill: "black",
        align : "left"
    });
    this.grpAss=grp;
    this.layer = stage.grpsLayer;
    this.picture.add(this.pictureImg);
    this.picture.add(this.text);
    this.members = [];
    var m;
    for (i=0; i < grp.members.length; i++){
        posm = getFreePosGrp(this.tabN);
        m = new KtcNodeGrp(this.tabN[posm].x,this.tabN[posm].y,r,GetZWNodeById(grp.members[i].id),stage.grpsLayer,stage,this);
        this.tabN[posm].kN = m;
        this.members.push(grp.members[i]);
        this.picture.add(m.pictNodeGrp);
    }
    this.layer.add(this.picture); 
    
    this.picture.on("mouseover", function() {
         document.body.style.cursor = "pointer";
        });
            
    this.picture.on("mouseout", function() {
        document.body.style.cursor = "default";
    });
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
        return true;
    } else { return false;};
};

function ResetGroups(stage, nodeP) {
    console.log("reset intial groups");
};

function initGoAction (go) {
    go.on('mouseover', function() {      
        var stage = this.getStage();
        document.body.style.cursor = "pointer";
        this.setOpacity(0.5);
        this.attrs.anim.start();
        stage.carouLayer.speed = 1;
        this.attrs.layer.draw();
        });
    go.on("mouseout", function() {
        var stage = this.getStage();
        document.body.style.cursor = "default";
        this.setOpacity(1);
        this.attrs.anim.stop();
        stage.carouLayer.speed = 1;
        this.attrs.layer.draw();
    });
    go.on("click", function() {
        var stage = this.getStage();
        var x = stage.elemsLayer.getX();
        this.attrs.anim.stop();
        stage.carouLayer.speed = 1;
        this.setOpacity(1);
        this.attrs.layer.draw();
    });
};

KtcInitCarouselNodes = function (r, wArea, stage) {
    var hArea = 2*r + 4;
    var maxSpeed = 10;
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
                    var x = stage.elemsLayer.getX() - ((100/frame.timeDiff) * stage.carouLayer.speed);
                    if (x <= -wArea) { x = stage.getWidth() - (2*hArea) + wArea;}
                    stage.elemsLayer.setX(x);
                    stage.carouLayer.moveToTop();
              //    console.log('Caroussel left');
                    if (stage.carouLayer.speed < maxSpeed) { stage.carouLayer.speed = stage.carouLayer.speed+ 0.1;}
                  }, stage.elemsLayer),
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
                    var x = stage.elemsLayer.getX() + ((100/frame.timeDiff) * stage.carouLayer.speed);
                    if (x >= stage.getWidth() - hArea) {
                        x=hArea - wArea ;}
                    stage.elemsLayer.setX(x);
                    stage.carouLayer.moveToTop();
           //       console.log('Caroussel right');
                    if (stage.carouLayer.speed < maxSpeed) { stage.carouLayer.speed=stage.carouLayer.speed+0.1;}
                  }, stage.elemsLayer),
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

function CreateGroups(stage, nodeP, st_design_url) {
    var wn = 60, hn = 60;
    var w = stage.getWidth()- (2*wn)-10;
    var h = stage.getHeight() - (2*hn)-10;
    var wg = 200, hg = 300;
    var spw = 10, sph = 10;
    var nbcol=0, nbli=0;
    if (nodeP.Groups.length *(wg+spw) <w){
         nbcol= nodeP.Groups.length;
         nbli = 1;
    } else {  
         nbcol = Math.floor(w / (wg+spw));
         nbli = Math.ceil(nodeP.Groups.length / nbcol);
    };
    var ccol = -1, cli =0, x=0,y=0;
    var imgGrp, dimGrp;
    for (var gi=0; gi < nodeP.Groups.length; gi++) {
        if (ccol == nbcol-1) {
            ccol =0; 
            cli++;
        } else {
            ccol++;
        };
        x= (ccol * (wg+spw)) + wn + spw;
        y= (cli * (hg+sph)) + hn + sph;
        imgGrp = new KtcGrpAss(x,y,wg,hg,nodeP.Groups[gi], stage);
        dimGrp = imgGrp.getDim();
    };
    w = stage.getWidth() - 2*wn;
    h = stage.getHeight() - 2*hn;
    nbcol = Math.ceil(w / (wn+spw));
    nbli = Math.ceil(h / (hn+sph));
    var r =  Math.floor((wn-2) / 2);
    ccol = 0;
    stage.carouLayer.setY(stage.getHeight() - (2*r + 4));
    stage.elemsLayer.setPosition(64, stage.getHeight() - (2*r + 4));
    for (var ni=0; ni < listNodes.length; ni++) {
        if (listNodes[ni] .Node != nodeP.Node) {
            x= (ccol * (wn+spw))+r+4;
            y= r+2,
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
