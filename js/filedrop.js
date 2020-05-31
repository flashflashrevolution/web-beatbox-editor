$.fn.extend({
    filedrop: function (options) {
        var defaults = {
            callback : null
        }
        options =  $.extend(defaults, options)
        return this.each(function() {
            var files = []
            var $this = $(this)

            // Stop default browser actions
            $this.bind('dragover', function(event) {
				$('body').addClass('fileDrag');
                event.stopPropagation()
                event.preventDefault()
            })
			
            // Stop default browser actions
            $this.bind('dragleave', function(event) {
				$('body').removeClass('fileDrag');
                event.stopPropagation()
                event.preventDefault()
            })

            // Catch drop event
            $this.bind('drop', function(event) {
				$('body').removeClass('fileDrag');
                // Stop default browser actions
                event.stopPropagation()
                event.preventDefault()

                // Get all files that are dropped
                files = event.originalEvent.target.files || event.originalEvent.dataTransfer.files;
				
                // Pass FileList through.
                if(options.callback) {
                    options.callback(files);
                }
                return false
            })
        })
    }
});

$(function(){
	$('body').filedrop({
		callback : function(fileList) {
			loadFileList(fileList);
		}
	})
});