
    function keyCodes () {
        // Define values for keycodes
        this.enter      = 13;
        this.space      = 32;
      
        this.left       = 37;
        this.up         = 38;
        this.right      = 39;
        this.down       = 40;
    }

    //
    // Function radioGroup() is a class to define an ARIA-enabled radiogroup widget.
    //
    // This widget attaches to an unordered list and makes each list entry a group
    // of radio buttons.
    //
    // @param (id object) id is the html id of the <ul> to attach to
    //
    // @return N/A
    //
    function radioGroup(id) {
    
      var thisObj = this;
    
      ///////// define widget properties ///////////////
    
      this.$id = $('#' + id);
    
      // find all list items with a role of radio
      this.$buttons = this.$id.find('li').filter('[role=radio]');
    
      // Store the currently checked item
      this.$checked = this.$buttons.filter('[aria-checked=true]');
    
      this.checkButton = true; // set to false during ctrl+arrow operations;
    
      this.$active = null; // the selected button (may not be checked)
      
      this.keys = new keyCodes();
    
      ///////////// Bind Event handlers ////////////////
    
      this.$buttons.click(function(e) {
        return thisObj.handleClick(e, $(this));
      });
    
      this.$buttons.keydown(function(e) {
        return thisObj.handleKeyDown(e, $(this));
      });
    
      this.$buttons.keypress(function(e) {
        return thisObj.handleKeyPress(e, $(this));
      });
    
      this.$buttons.focus(function(e) {
        return thisObj.handleFocus(e, $(this));
      });
    
      this.$buttons.blur(function(e) {
        return thisObj.handleBlur(e, $(this));
      });
    }
    
    //
    // Function selectButton() is a member function to select and possibly check a button in the
    // radioGroup.
    //
    // @param ($id object) $id is the jQuery object of the button to select
    //
    // @return N/A
    //
    radioGroup.prototype.selectButton = function($id) {
    
      if (this.checkButton == true) {
        // checking the button
        
        if (this.$checked.length == 0) { // no previously checked group buttons
          // the first and last items in the group will have
          // tabindex=0. Remove them both from the tab order.
          this.$buttons.first().attr('tabindex', '-1');
    
          this.$buttons.last().attr('tabindex', '-1');
        }
        else {
          // remove the previously checked item from
          // the tab order and modify it's aria attributes accordingly
          this.$checked.attr('tabindex', '-1').attr('aria-checked', 'false');
          this.$checked.find(":radio").removeAttr("checked");
        }
    
        // Place this button in the tab order and modify it's aria attributes
        $id.attr('tabindex', '0').attr('aria-checked', 'true');
        $id.find(":radio").attr("checked","checked");
    
        // update the stored $checked object
        this.$checked = $id;
      }
    
      // update the stored $active object
      this.$active = $id;
        
      // Reset checkButton flag - in case it was false
      this.checkButton = true;
    
    } // end selectButton()
    
    //
    // Function handleClick() is a member function to process keydown events for the radioGroup.
    //
    // @param (e object) e is the event object
    //
    // @param ($id object) $is is the jquery object of the triggering element
    //
    // @return (boolean) Returns false if consuming event; true if propagating
    //
    radioGroup.prototype.handleClick = function(e, $id) {
    
      if (e.altKey || e.ctrlKey || e.shiftKey) {
        // do nothing
        return true;
      }
    
      // simply consume the event - browser calls focus()
    
      e.stopPropagation();
      return false;
    
    } // end handleClick()
    
    //
    // Function handleKeyDown() is a member function to process keydown events for the radioGroup.
    //
    // @param (e object) e is the event object
    //
    // @param ($id object) $is is the jquery object of the triggering element
    //
    // @return (boolean) Returns false if consuming event; true if propagating
    //
    radioGroup.prototype.handleKeyDown = function(e, $id) {
    
      if (e.altKey) {
        // do nothing
        return true;
      }
    
      switch (e.keyCode) {
        case this.keys.space:
        case this.keys.enter: {
          if (e.ctrlkey || e.shiftKey) {
            // do nothing
            return true;
          }
    
          // select and check the button
          this.selectButton($id);
    
          e.stopPropagation();
          return false;
        }
        case this.keys.left:
        case this.keys.up: {
    
          var $prev = $id.prev(); // the previous button
    
          if (e.shiftKey) {
            // do nothing
            return true;
          }
    
          // if this was the first item
          // select the last one in the group.
          if ($id.index() == 0) {
            $prev = this.$buttons.last();
          }
    
          if (e.ctrlKey) {
            // set checkButton to false so
            // focus does not check button
            this.checkButton = false;
          }
    
          // select the previous button
          $prev[0].focus();
    
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        case this.keys.right:
        case this.keys.down: {
    
          var $next = $id.next(); // the next button
    
          if (e.shiftKey) {
            // do nothing
            return true;
          }
    
          // if this was the last item,
          // select the first one in the group.
          if ($id.index() == this.$buttons.length - 1) {
            $next = this.$buttons.first();
          }
    
          if (e.ctrlKey) {
            // set checkButton to false so
            // focus does not check button
            this.checkButton = false;
          }
    
          // select the next button
          $next[0].focus();
    
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      } // end switch
    
      return true;
    
    } // end handleKeyDown()
    
    //
    // Function handleKeyPress() is a member function to process keydown events for the radioGroup.
    // This is needed to prevent browsers that process window events on keypress (such as Opera) from
    // performing unwanted scrolling of the window, etc.
    //
    // @param (e object) e is the event object
    //
    // @param ($id object) $is is the jquery object of the triggering element
    //
    // @return (boolean) Returns false if consuming event; true if propagating
    //
    radioGroup.prototype.handleKeyPress = function(e, $id) {
    
      if (e.altKey) {
        // do nothing
        return true;
      }
    
      switch (e.keyCode) {
        case this.keys.space:
        case this.keys.enter: {
          if (e.ctrlKey || e.shiftKey) {
            // do nothing
            return true;
          }
        }
        case this.keys.left:
        case this.keys.up:
        case this.keys.right:
        case this.keys.down: {
          if (e.shiftKey) {
            // do nothing
            return true;
          }
          e.stopPropagation();
          return false;
        }
      } // end switch
    
      return true;
    
    } // end handleKeyPress()
    
    //
    // Function handleFocus() is a member function to process focus events for the radioGroup.
    //
    // @param (e object) e is the event object
    //
    // @param ($id object) $is is the jquery object of the triggering element
    //
    // @return (boolean) Returns false if consuming event; true if propagating
    //
    radioGroup.prototype.handleFocus = function(e, $id) {
    
      // select the button
      this.selectButton($id);
    
      return true;
    } // end handleFocus()