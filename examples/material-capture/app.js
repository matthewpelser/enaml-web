// The material template does not let you generate this 
// ready bootstrap so setting window global to work around this
$(document).ready(function(){
    initViewer(window.VIEWERID);
});

const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

function initViewer(ref) {

    $('.plotly-chart').each(function(i, e){
        Plotly.newPlot(e, $(e).data('traces'), $(e).data('layout')); 
    });

    $('.plotly-chart').on('redraw', debounce((e, value) => {
        console.log(e);
        const el = e.currentTarget;
        console.log($(el).data('traces'))
        console.log(value)
        Plotly.newPlot(el, JSON.parse(value), $(el).data('layout')); 
    }, 250));

    var ws = new WebSocket("ws://localhost:8888/websocket/?ref="+ref);
    ws.onopen = function(evt) {
        console.log("Connected!");
    };

    ws.onmessage = function(evt) {
        var change = JSON.parse(evt.data);
        console.log('onmessage')
        console.log(change);
        var $tag = $('#'+change.id);
        change.object = $tag;

        if (change.type === 'refresh') {
            $tag.html(change.value);
        } else if (change.type === 'trigger') {
            $tag.trigger(change.name, change.value);
        } else if (change.type === 'added') {
            $tag.append($(change.value));
        } else if (change.type === 'removed') {
            $tag.find('#'+change.value).remove();
        } else if (change.type === 'update') {
            if (change.name==="text") {
                var node = $tag.contents().get(0);
                if (!node) {
                    node = document.createTextNode("");
                    $tag.append(node);
                }
                node.nodeValue = change.value;
            } else if (change.name==="attrs") {
                $.map(change.value,function(v,k){
                    $tag.prop(k,v);
                });
            } else {
                if (change.name==="cls") {
                    change.name = "class";
                }
                $tag.prop(change.name,change.value);
            }
        } else {
            console.log("Unknown change type");
        }
    };

    ws.onclose = function(evt) {
        console.log("Disconnected!");
    };

    function sendEvent(change) {
        console.log('send')
        console.log(change);
        ws.send(JSON.stringify(change));
    };

    function sendNodeValue(){
        sendEvent({
            'id': this.id,
            'type':'update',
            'name':'value',
            'value':$(this).val(),
        });
    };

    $(document).on('click', '[clickable]',function(e){
        e.preventDefault();
        sendEvent({
            'id':this.id,
            'type':'event',
            'name':'clicked'
        });
    });
    $(document).on('change', ":checkbox", function(){
        sendEvent({
        'id':this.id,
        'type':'update',
        'name':'checked',
        'value':($(this).prop('checked'))?'checked':'',
        });
    });
    $(document).on('change', "select", sendNodeValue);
    $(document).on('input', 'input', sendNodeValue);
    $(document).on('change', 'textarea', function() {
        sendEvent({
            'id':this.id,
            'type':'update',
            'name':'text',
            'value':$(this).val(),
        });
    });

    return ws;
}
