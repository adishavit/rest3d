setViewer6Upload=function(upload){
var url = '/rest3d/upload',
        uploadButton = $('<button/>')
            .addClass('btn')
            .prop('disabled', true)
            .text('Uploading...')
            .on('click', function (){
                var $this = $(this),
                    data = $this.data();
                $this
                    .off('click')
                    .text('Abort')
                    .on('click', function () {
                        $this.remove();
                        data.abort();
                    });
                data.submit().always(function () {
                    $this.remove();
                });
        }),
        // show the name of the file nicely
        formatName = function(data,file){
            var i = file.name.lastIndexOf('/');
            return file.name.substring(i+1);
        },
        convertButton = $('<button/>')
            .addClass('btn')
            .prop('disabled', true)
            .text('Converting...')
            .on('click', function () {
                var $this = $(this),
                    data = $this.data();
                $this
                    .off('click')
                    .text('Converting...')
                    .prop('disabled',true)
                // user rest to convert dae into glTF
                var callback = function(data) {
                    $this.remove();
                    if(data.result.output){console.debug(data.result.output);}
                    if(data.result.code){console.debug("Exit code: "+data.result.code);}
                    if (data.error){
                        var span = $('<p><span><b>Error code='+data.error.code+' :: '+data.error.message+'</b></span></p>');
                        data.context.append(span);
                    } else {
                        // ennumerate all resulting files
                        $.each(data.result.files, function (index, file) {

                            var span = '<p><span><a href="'+decodeURIComponent(file.url)+'" target="_blank"><p><span>'+formatName(data,file)+'</a>';
                            // endsWith
                            if (file.url.indexOf('.json', file.url.length - '.json'.length) !== -1) {
                                var url='/viewer/viewer4.html?file=/rest3d/upload/'+decodeURIComponent(file.name);
                                span += ' -> <a href="'+url+'" target="_blank"> View '+formatName(data,file)+'</a>';
                            }
                            span += '</span></p>';
                            data.context.append($(span));
                        });
                    }
                }

                rest3d.convert(data,callback);
            });


    upload.object.on('fileuploadadd', function (e, data) {
        upload.object=$(this);
        data.context = $('<div/>').appendTo(upload.filesArea);
        $.each(data.files, function (index, file) {
            var node = $('<p/>')
                    .append($('<span/>').text(file.name));
            if (!index) {
                node
                    .append('<br>')
                    .append(uploadButton.clone(true).data(data));
            }
            node.appendTo(data.context);
        });
    }).on('fileuploadprocessalways', function (e, data) {
        var index = data.index,
            file = data.files[index],
            node = $(data.context.children()[index]);
        if (file.preview) {
            node
                .prepend('<br>')
                .prepend(file.preview);
        }
        if (file.error) {
            node
                .append('<br>')
                .append(file.error);
        }
        if (index + 1 === data.files.length) {
            data.context.find('button')
                .text('Upload')
                .prop('disabled', !!data.files.error);
        }
    }).on('fileuploadprogressall', function (e, data) {
        var progress = parseInt(data.loaded / data.total * 100, 10);
        upload.progress.setValue(progress);
    }).on('fileuploaddone', function (e, data) {
        $.each(data.result.files, function (index, file) {
            var link = $('<a>')
                .attr('target', '_blank')
                .prop('href', file.url);
            $(data.context.children()[index])
                .find('span').text(file.name);
            $(data.context.children()[index])  
                .wrap(link);
            file.assetName = data.result.files[index].name;
            var $node = convertButton.clone(true).data({file: file, context: data.context})
                .text('Convert')
                .prop('disabled', !/dae$/i.test(file.url));
            $(data.context.children()[index]).parent() // the <a>
                .append($node);
        });
    }).on('fileuploadfail', function (e, data) {
        if (!data.result) {
            $(data.context.children()[0])
                .append('<br>')
                .append('error communicating with server')
                .find('button').remove();
        } else
        $.each(data.result.files, function (index, file) {
            var error = $('<span/>').text(file.error);
            $(data.context.children()[index])
                .append('<br>')
                .append(error)
                .find('button').remove();
        });
    });
}