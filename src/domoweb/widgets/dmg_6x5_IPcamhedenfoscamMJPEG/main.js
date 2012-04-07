(function($) {
    $.create_widget({
        // default options
        options: {
            version: 0.1,
            creator: 'Basilic,Domogik',
            id: 'dmg_6x5_IPcamhedenfoscamMJPEG',
            name: 'Image Stream with motion control',
            description: 'Widget for displaying Webcam MJPEG stream',
            type: 'sensor.string',
            height: 5,
            width: 6,
            filters:['camera.foscam.mjpeg'],
            displayname : true,
			displayborder: false
        },

        _init: function() {
            var self = this, o = this.options;
            var test = "";
            var main = $("<div class='main'></div>");
            typecamera= o.featurename;
            if(typecamera=="foscam-heden"){
               adressimg=o.deviceaddress;
               user=adressimg.search("user=");
               pwd=adressimg.search("pwd=");
               if(user!="-1"){
                  addressip=adressimg.substr(0,user);
                  userpwd=adressimg.substr(user);                  
                  addressimg=addressip +'videostream.cgi?'+userpwd;
                  }
                 
               this.image =$('<img src="'+addressimg+'"/>');
               this.buttondown=$('<div class="command down">Down</div>');
               this.buttondown.click(function (e){self.actionstep(addressip,2,userpwd);});
               this.buttonup=$('<div class="command up">Up</div>');
               this.buttonup.click(function (e){self.actionstep(addressip,0,userpwd);});
               this.buttonleft=$('<div class="command left">Left</div>');
               this.buttonleft.click(function (e){self.actionstep(addressip,4,userpwd);});
               this.buttonright=$('<div class="command right">Right</div>');
               this.buttonright.click(function (e){self.actionstep(addressip,6,userpwd);});
               this.buttonhome=$('<div class="command home">Test</div>');
               this.buttonhome.click(function (e){self.action(addressip,26,userpwd);});

               this.image =$('<img src="'+addressimg+'"/>');
               this.element.append(this.image);
               this.element.append(this.buttonup);
               this.element.append(this.buttondown);
               this.element.append(this.buttonleft);
               this.element.append(this.buttonright);
//               this.element.append(this.buttonhome);
            } else {
               this.image =$('<img src="'+ o.deviceaddress +'"/>');
               this.element.append(this.image);
            }
        },

        actionstep: function(address,command,userpwd) {
           var self = this, o = this.options;
           var xhr=null;
           addresscmd= address + "decoder_control.cgi?"+userpwd+"&command="+command+"&onestep=1"
           xhr=new XMLHttpRequest();
           xhr.open("POST", addresscmd ,true);
           xhr.send(null);
        },
        _statsHandler: function(stats) {
        },


        action: function(address,command,userpwd) {
//comand,function=[0,UP][1,stopUp][2,Down][3,stopdown][4,left][5,stoplef][6,ritht][7,stopRight][25,Home position][26,Vertical Patrol][27,StopVertical Patrol]
           var self = this, o = this.options;
           var xhr=null;
           addresscmd= address + "decoder_control.cgi?"+userpwd+"&command="+command
           xhr=new XMLHttpRequest();
           xhr.open("POST", addresscmd ,true);
           xhr.send(null);
        },

        _statsHandler: function(stats) {
        },

        _eventHandler: function(timestamp, value) {
        },
        
        setValue: function(value, unit, previous) {
        }
    });
})(jQuery);
