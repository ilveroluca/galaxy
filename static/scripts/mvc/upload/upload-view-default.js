define(["utils/utils","mvc/upload/upload-model","mvc/upload/upload-row","mvc/upload/upload-ftp","mvc/ui/ui-popover","mvc/ui/ui-select","utils/uploadbox"],function(a,b,c,d,e,f){return Backbone.View.extend({default_extension:"auto",default_genome:"?",auto:{id:"auto",text:"Auto-detect",description:"This system will try to detect the file type automatically. If your file is not detected properly as one of the known formats, it most likely means that it has some format problems (e.g., different number of columns on different rows). You can still coerce the system to set your data to the format you think it should be.  You can also upload compressed files, which will automatically be decompressed."},select_extension:null,select_genome:null,uploadbox:null,upload_size:0,collection:new b.Collection,ftp:null,counter:{announce:0,success:0,error:0,running:0,reset:function(){this.announce=this.success=this.error=this.running=0}},initialize:function(a){var b=this;this.app=a,this.setElement(this._template("upload-box","upload-info"));var b=this;this.uploadbox=this.$el.uploadbox({announce:function(a,c,d){b._eventAnnounce(a,c,d)},initialize:function(a,c,d){return b._eventInitialize(a,c,d)},progress:function(a,c,d){b._eventProgress(a,c,d)},success:function(a,c,d){b._eventSuccess(a,c,d)},error:function(a,c,d){b._eventError(a,c,d)},complete:function(){b._eventComplete()}}),this.select_extension=new f.View({css:"header-selection",data:this.app.list_extensions,container:this.$el.find("#header-extension"),value:this.default_extension,onchange:function(a){b.updateExtension(a)}}),b.$el.parent().find("#header-extension-info").on("click",function(a){b._showExtensionInfo({$el:$(a.target),title:b.select_extension.text(),extension:b.select_extension.value(),placement:"top"})}).on("mousedown",function(a){a.preventDefault()}),this.select_genome=new f.View({css:"header-selection",data:this.app.list_genomes,container:this.$el.find("#header-genome"),value:this.default_genome,onchange:function(a){b.updateGenome(a)}}),this._updateScreen(),this.collection.on("remove",function(a){b._eventRemove(a)})},_eventRemove:function(a){var b=a.get("status");"success"==b?this.counter.success--:"error"==b?this.counter.error--:this.counter.announce--,this._updateScreen(),this.uploadbox.remove(a.id)},_eventAnnounce:function(a,b){this.counter.announce++,this._updateScreen();var d=new c(this,{id:a,file_name:b.name,file_size:b.size,file_mode:b.mode,file_path:b.path});this.collection.add(d.model),$(this.el).find("tbody:first").append(d.$el),d.render()},_eventInitialize:function(a,b){var c=this.collection.get(a);c.set("status","running");var d=(c.get("file_name"),c.get("file_path")),e=c.get("file_mode"),f=c.get("extension"),g=c.get("genome"),h=c.get("url_paste"),i=c.get("space_to_tabs"),j=c.get("to_posix_lines");return h||b.size>0?(this.uploadbox.configure({url:this.app.options.nginx_upload_path}),this.uploadbox.configure("local"==e?{paramname:"files_0|file_data"}:{paramname:null}),tool_input={},"new"==e&&(tool_input["files_0|url_paste"]=h),"ftp"==e&&(tool_input["files_0|ftp_files"]=d),tool_input.dbkey=g,tool_input.file_type=f,tool_input["files_0|type"]="upload_dataset",tool_input["files_0|space_to_tab"]=i&&"Yes"||null,tool_input["files_0|to_posix_lines"]=j&&"Yes"||null,data={},data.history_id=this.current_history,data.tool_id="upload1",data.inputs=JSON.stringify(tool_input),data):null},_eventProgress:function(a,b,c){var d=this.collection.get(a);d.set("percentage",c),this.ui_button.set("percentage",this._uploadPercentage(c,b.size))},_eventSuccess:function(a){var b=this.collection.get(a);b.set("percentage",100),b.set("status","success");var c=b.get("file_size");this.ui_button.set("percentage",this._uploadPercentage(100,c)),this.upload_completed+=100*c,this.counter.announce--,this.counter.success++,this._updateScreen(),Galaxy.currHistoryPanel.refreshContents()},_eventError:function(a,b,c){var d=this.collection.get(a);d.set("percentage",100),d.set("status","error"),d.set("info",c),this.ui_button.set("percentage",this._uploadPercentage(100,b.size)),this.ui_button.set("status","danger"),this.upload_completed+=100*b.size,this.counter.announce--,this.counter.error++,this._updateScreen()},_eventComplete:function(){this.collection.each(function(a){"queued"==a.get("status")&&a.set("status","init")}),this.counter.running=0,this._updateScreen()},_showExtensionInfo:function(a){var b=this,c=a.$el,d=a.extension,f=a.title,g=_.findWhere(b.list_extensions,{id:d});this.extension_popup&&this.extension_popup.remove(),this.extension_popup=new e.View({placement:a.placement||"bottom",container:c,destroy:!0}),this.extension_popup.title(f),this.extension_popup.empty(),this.extension_popup.append(this._templateDescription(g)),this.extension_popup.show()},_eventFtp:function(){this.ftp.visible?this.ftp.hide():(this.ftp.empty(),this.ftp.append(new d(this).$el),this.ftp.show())},_eventCreate:function(){this.uploadbox.add([{name:"New File",size:0,mode:"new"}])},_eventStart:function(){if(!(0==this.counter.announce||this.counter.running>0)){var a=this;this.upload_size=0,this.upload_completed=0,this.collection.each(function(b){"init"==b.get("status")&&(b.set("status","queued"),a.upload_size+=b.get("file_size"))}),this.ui_button.set("percentage",0),this.ui_button.set("status","success"),this.counter.running=this.counter.announce,this._updateScreen(),this.uploadbox.start()}},_eventStop:function(){0!=this.counter.running&&(this.ui_button.set("status","info"),this.uploadbox.stop(),$("#upload-info").html("Queue will pause after completing the current file..."))},_eventReset:function(){0==this.counter.running&&(this.collection.reset(),this.counter.reset(),this._updateScreen(),this.uploadbox.reset(),this.select_extension.value(this.default_extension),this.select_genome.value(this.default_genome),this.ui_button.set("percentage",0))},updateExtension:function(a,b){var c=this;this.collection.each(function(d){"init"!=d.get("status")||d.get("extension")!=c.default_extension&&b||d.set("extension",a)})},updateGenome:function(a,b){var c=this;this.collection.each(function(d){"init"!=d.get("status")||d.get("genome")!=c.default_genome&&b||d.set("genome",a)})},_updateScreen:function(){message=0==this.counter.announce?this.uploadbox.compatible()?"You can Drag & Drop files into this box.":"Unfortunately, your browser does not support multiple file uploads or drag&drop.<br>Some supported browsers are: Firefox 4+, Chrome 7+, IE 10+, Opera 12+ or Safari 6+.":0==this.counter.running?"You added "+this.counter.announce+" file(s) to the queue. Add more files or click 'Start' to proceed.":"Please wait..."+this.counter.announce+" out of "+this.counter.running+" remaining.",$("#upload-info").html(message)},_uploadPercentage:function(a,b){return(this.upload_completed+a*b)/this.upload_size},_templateDescription:function(a){if(a.description){var b=a.description;return a.description_url&&(b+='&nbsp;(<a href="'+a.description_url+'" target="_blank">read more</a>)'),b}return"There is no description available for this file extension."},_template:function(a,b){return'<div class="upload-top"><h6 id="'+b+'" class="upload-info"></h6></div><div id="'+a+'" class="upload-box"><table id="upload-table" class="table table-striped" style="display: none;"><thead><tr><th>Name</th><th>Size</th><th>Type</th><th>Genome</th><th>Settings</th><th>Status</th><th></th></tr></thead><tbody></tbody></table></div><div id="upload-header" class="upload-header"><span class="header-title">Type (set all):</span><span id="header-extension"/><span id="header-extension-info" class="upload-icon-button fa fa-search"/> <span class="header-title">Genome (set all):</span><span id="header-genome"/></div>'}})});
//# sourceMappingURL=../../../maps/mvc/upload/upload-view-default.js.map