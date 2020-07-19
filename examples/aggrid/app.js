function initViewer(ref) {
        
    const gridDiv = document.querySelector('.mygrid');

    // Test trigger custom trigger events from enaml
    $(gridDiv).on('selectAll', (e, value) => {
        console.log(`selectAll ${value}`);
        gridOptions.api.selectAll();
    })

    $(gridDiv).on('setRowData', (e, value) => {
        console.log(`setRowData ${JSON.stringify(value)}`);
        gridOptions.api.setRowData(value);
    })

    // Bind a general update on attribs
    $(gridDiv).on('update', (attibs) => {
        const c = $(gridDiv).data('columndefs');
        const r = $(gridDiv).data('rowdata');
        // Rebing from data attribs
    })

    // Use data attibs for data;
    const columnDefs = $(gridDiv).data('columndefs');
    const rowData = $(gridDiv).data('rowdata');
    const gridId = $(gridDiv).attr('id');


    const gridOptions = { 
        columnDefs,
        rowData,
        rowSelection: 'single',
        onSelectionChanged: () => {
            const selectedRows = gridOptions.api.getSelectedRows();
            sendEvent({
                'id': gridId,
                'type':'event',
                'name':'onSelectionChanged',
                'value': selectedRows,
            });
        }
     };

    new agGrid.Grid(gridDiv, gridOptions);

    var ws = new WebSocket("ws://localhost:8888/websocket/?ref="+ref);
    ws.onopen = function(evt) {
        console.log("Connected!");
    };

    ws.onmessage = function(evt) {
        var change = JSON.parse(evt.data);
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
