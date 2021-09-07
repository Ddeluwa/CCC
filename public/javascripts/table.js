$(document).ready(function(){
    $.ajax({
        url:"/treetalker/:ttcloud"
        , type : "POST"
        , dataType : "JSON"
        
    })
})