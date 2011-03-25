/*
    Document   : map.js
    Created on : Feb 16, 2011, 3:25:27 PM
    Author     : "Ajay Ranipeta <Ajay.Ranipeta@csiro.au>"
 */

var map;
var Maps = (function() {

    var clickLocation;
    var occids;
    var infowindow;
    var infomarker;
    var overlayLayers = [];
    var envLayer;

    /**
     * post a query to the biocache-service
     * to check if there are any points
     * at the click location
     *
     */
    function loadOccurrencePopup(location) {
        clickLocation = location;

        infowindow.close();
        //need to calculate radius based on zoom level and point size
        var radius = 0;
        switch (map.zoom){
            case 0:
                radius = 800;
                break;
            case 1:
                radius = 400;
                break;
            case 2:
                radius = 200;
                break;
            case 3:
                radius = 100;
                break;
            case 4:
                radius = 50;
                break;
            case 5:
                radius = 25;
                break;
            case 6:
                radius = 20;
                break;
            case 7:
                radius = 7.5;
                break;
            case 8:
                radius = 3;
                break;
            case 9:
                radius = 1.5;
                break;
            case 10:
                radius = .75;
                break;
            case 11:
                radius = .25;
                break;
            case 12:
                radius = .15;
                break;
            case 13:
                radius = .1;
                break;
            case 14:
                radius = .05;
                break;
            case 15:
                radius = .025;
                break;
            case 16:
                radius = .015;
                break;
            case 17:
                radius = 0.0075;
                break;
            case 18:
                radius = 0.004;
                break;
            case 19:
                radius = 0.002;
                break;
            case 20:
                radius = 0.001;
                break;
                
        }

        //modifiers if we have a larger point size
        var size = $('#sizeslider').slider('value');
        if (size >= 5 && size < 8){
            radius = radius*2;
        }
        if (size >= 8){
            radius = radius*3;
        }

        var baseurl = Config.OCC_SEARCH_URL;
        var wmsinfo = baseurl + ((searchString) ? encodeURI(searchString) : "?"); // window.location.search;
        wmsinfo += "&zoom=" + map.getZoom();
        wmsinfo += "&lat=" + location.lat();
        wmsinfo += "&lon=" + location.lng();
        wmsinfo += "&radius=" + radius;

        $('#maploading').show();
        $.ajax({
            url: wmsinfo,
            dataType: "jsonp",
            success: loadNewGeoJsonData
        });
    }

    function loadNewGeoJsonData(data) {
        var displayHtml = "Occurrence Information at " + clickLocation.toString();

        if (data.count > 0) {
            displayHtml = data.count + ((data.count>1)?' occurrences founds.':' occurrence found.');
            displayHtml += '<div id="occinfo">Loading occurrence info</div>';
            occids = data.occurrences;

            Maps.loadOccurrenceInfo(0);

            infomarker.setPosition(clickLocation);            
        } else {
            //occids = new Array(); 
            occids == null; // did you mean occids = null ?

            displayHtml = data.count + ' occurrences founds';
            $('#maploading').fadeOut('slow');
        }

    }

    function initialiseOverlays(lyrCount) {

        // clear any existing MySpecies layers only from the map
        if (overlayLayers.length > 0) {
            for (i=0;i<overlayLayers.length;i++){
                map.overlayMapTypes.removeAt(1);
            }
        }

        // clear our local array
        //map.overlayMapTypes.clear();
        overlayLayers = [];

        // add some placeholders
        if (lyrCount > 0) {
            for (i=0;i<lyrCount;i++){
                map.overlayMapTypes.push(null);
            }
        }
    }

    /**
    * Load occurrences wms with the selected params
    */
    function insertWMSOverlay(name, params) {
        var customParams = [
        "FORMAT=image/png8"
        ];

        if (arguments.length > 1) {
            for (var i = 0; i < arguments.length; i++) {
                customParams.push(arguments[i]);
            }
        }

        //Add query string params to custom params
        var searchParam = encodeURI(searchString); // NdR - fixes bug where terms have quotes around them
        var pairs = searchParam.substring(1).split('&');
        for (var j = 0; j < pairs.length; j++) {
            customParams.push(pairs[j]);
        }
        //loadWMS(map, "http://spatial.ala.org.au/geoserver/wms?", customParams);
        //var overlayWMS = getWMSObject(map, "MySpecies - " + name, Config.OCC_WMS_BASE_URL, customParams);
        //        google.maps.event.addListener(overlayWMS, 'tilesloaded', function(event) {
        //            console.log("tiles loaded for overlayWMS");
        //        });
        //map.overlayMapTypes.insertAt(map.overlayMapTypes.length, overlayWMS);
        //overlayLayers.push(overlayWMS);
        var wmstile = new WMSTileLayer("MySpecies - " + name, Config.OCC_WMS_BASE_URL, customParams, wmsTileLoaded);
        overlayLayers.push(wmstile);
    }

    function wmsTileLoaded(numtiles) {
        $('#maploading').fadeOut("slow");
    }

    return {
        /**
         * loads a static map with all the points within Australia
         * and additional facets
         */
        loadMap: function() {
            var baseurl = "http://localhost:8080/biocache-service/occurrences/static";
            var wmsimg = baseurl + window.location.search;
            document.getElementById('wmsimg').src= wmsimg;
        },
        
        /**
         * loads google maps and the WMS layers for occurrences
         */
        initialise: function() {
            
            var myLatlng = new google.maps.LatLng(-27, 133);
            var myOptions = {
                zoom: 4,
                scrollwheel: false, // Dave says: leave as false
                center: myLatlng,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                scaleControl: true, 
                streetViewControl: false
            }
            map = new google.maps.Map(document.getElementById("mapcanvas"), myOptions);
            infomarker = new google.maps.Marker({
                position: myLatlng,
                visible: false,
                title: "Click location", 
                map: map
            });
            infowindow = new google.maps.InfoWindow({
                size: new google.maps.Size(300, 200)
            });

            map.setOptions({
                mapTypeControlOptions: {
                    mapTypeIds: [
                    google.maps.MapTypeId.ROADMAP,
                    google.maps.MapTypeId.TERRAIN,
                    google.maps.MapTypeId.SATELLITE,
                    google.maps.MapTypeId.HYBRID
                    ],
                    style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
                }
            });

            map.controls[google.maps.ControlPosition.TOP_RIGHT].push(document.getElementById('legend'));

            google.maps.event.addListener(map, 'click', function(event) {
                loadOccurrencePopup(event.latLng);
            });

            google.maps.event.addListener(map, 'tilesloaded', function() {
                $('#legend').show();
            });
            
            // populate the env.layer dropdown
            var opts='<option value="-1">None</option>';
            $.each(envLayers, function(key, value) {
                opts += '<option value="'+key+'">'+value[1]+'</option>';
            });
            $('#envLyrList').html(opts);

        },

        /**
         * Load occurrences wms with the selected params 
         */
        toggleOccurrenceLayer: function(input) {
            var _idx = parseInt($(input).attr('id').substr(3));
            if ($(input).is(':checked')){
                map.overlayMapTypes.setAt((_idx+1),overlayLayers[_idx]);
            }else{
                if (map.overlayMapTypes.getLength()>0){
                    map.overlayMapTypes.setAt((_idx+1),null);
                }
            }
        },

        /**
         * iterate thru' the occurrence info popup 
         */
        loadOccurrenceInfo: function(curr) {

            var pbutton = '';
            var nbutton = '';
            if (curr > 0) {
                pbutton = '<span class="pagebutton"><a href="#map" onClick="Maps.loadOccurrenceInfo('+(curr-1)+')">&lt; Previous</a></span>';
            }
            if (curr < occids.length-1) {
                nbutton = '<span class="pagebutton" style="float: right"><a href="#map" onClick="Maps.loadOccurrenceInfo('+(curr+1)+')">Next &gt;</a></span>';
            }

            infowindow.setContent('<div style="height:200px">Loading occurrence info. Please wait...</div>');

            $.get(Config.OCC_INFO_URL_JSON.replace(/_uuid_/g,occids[curr]), function(data){
                var displayHtml = occids.length + ((occids.length>1)?' occurrences founds.':' occurrence found.');

                displayHtml = '';
                displayHtml = '<div id="occinfo">';
                displayHtml += '<span class="occinfohead"><strong>Viewing ' + (curr+1) + ' of ' + occids.length + ' occurrence'+((occids.length>1)?'s':'')+'.</strong></span>';
                displayHtml += "<br /><br />";

                displayHtml += "Scientific Name: " + data.record.raw.classification.scientificName + '<br />';
                displayHtml += "Family: " + data.record.raw.classification.family + '<br />';
                displayHtml += "Institution: " + data.record.processed.attribution.institutionName + '<br />';

                displayHtml += "<br />";
                displayHtml += '<a class="iframe fancy_iframe" href="'+(Config.OCC_INFO_URL_HTML.replace(/_uuid_/g,occids[curr]))+'">More information</a> | ';
                displayHtml += '<a class="iframe fancy_iframe" href="'+(Config.OCC_ANNOTATE_URL_HTML.replace(/_uuid_/g,occids[curr]))+'">Flag an issue</a>';
                displayHtml += "<br /><br />";
                displayHtml += pbutton + "&nbsp;" + nbutton;
                
                displayHtml += '</div>';

                infowindow.setContent(displayHtml);
                infowindow.open(map,infomarker);
                $('#maploading').fadeOut('slow');
            });

            return false; 
        },

        /**
         * Load occurrences divided by the facet values 
         */
        loadOccurrencesByType: function(cbf) {

            $('#maploading').show();

            var _idx = -1;
            var legHtml = "";

            // set the default, if none available to institution_name
            if (arguments.length == 0) {
                cbf = 'institution_name';
            }

            if (cbf=="") {
                var key = 0;
                var label = "All occurrences";
                initialiseOverlays(1);
                insertWMSOverlay("All occurrences", "&colourby="+label.hashCode()+"&symsize="+$('#sizeslider').slider('value')); //fHashes[key]);
                legHtml += "<div>";
                legHtml += "<input type='checkbox' class='layer' id='lyr"+key+"' checked='checked' /> ";
                legHtml += "<img src='"+Config.BIOCACHE_SERVICE_URL+"/occurrences/legend?colourby="+label.hashCode()+"&width=10&height=10' /> ";
                legHtml += "<label for='lyr"+key+"'>" + label + "</label>";
                legHtml += "</div>";

            } else {
                // get and check if the default facet is available,
                // if not, set it to the first one.
                _idx = $.inArray(cbf, facetNames);
                _idx = (_idx>-1)?_idx:1;
                $('#colourFacets').val(cbf);


                var fLabels = facetLabels[_idx].split("|");
                var fValues = facetValues[_idx].split("|");
                //var fHashes = facetValueHashes[_idx].split("|");
                var fCounts = facetValueCounts[_idx].split("|");

            
                // clear the current overlays
                //map.overlayMapTypes.clear();
                initialiseOverlays(fValues.length);

                $.each(fValues, function(key, value) {
                    //var ptcolour = '#'+(Math.abs(fHashes[key])).toString(16);
                    //var ptcolour = (function(h){return '#000000'.substr(0,7-h.length)+h})((~~(Math.abs(fHashes[key]))).toString(16).substr(0,6));
                    //Maps.loadOccurrences("fq="+cbf+":"+value+"&colourby="+fHashes[key]);

                    var label = fLabels[key];
                    if (label!='') {
                        var cbfq=cbf+":"+value;
                        if (value == "" && label=='Other') {
                            cbfq = "-("+cbf+":[* TO *])";
                        }

                        insertWMSOverlay(label, "fq="+cbfq+"&colourby="+label.hashCode()+"&symsize="+$('#sizeslider').slider('value')); //fHashes[key]);

                        legHtml += "<div class='layerWrapper'>";
                        legHtml += "<input type='checkbox' class='layer' id='lyr"+key+"' checked='checked' /> ";
                        legHtml += "<img src='"+Config.BIOCACHE_SERVICE_URL+"/occurrences/legend?colourby="+label.hashCode()+"&width=10&height=10' /> ";
                        legHtml += "<label for='lyr"+key+"'>" + label + "</label>";
                        legHtml += "</div>";
                    }

                });
            }

            // display the legend content
            $('#legendContent').ready(function() {
                $('#legendContent').html(legHtml);
            });


            // now iterate thru' the array and load the layers
            $.each(overlayLayers, function(_idx, overlayWMS) {
                map.overlayMapTypes.setAt(_idx+1, overlayWMS);
            });
        },

        loadEnvironmentalLayer: function(selLayer) {
            map.overlayMapTypes.setAt(0, null);
            if (selLayer > -1) {
                var overlayWMS = new WMSTileLayer(envLayers[selLayer][1], "http://spatial.ala.org.au/geoserver/wms/reflect?", ["format=image/png","layers="+envLayers[selLayer][2]], wmsTileLoaded);
                map.overlayMapTypes.setAt(0, overlayWMS);
            }
        }

    } // return: public variables and methods
})();

// Jquery Document.onLoad equivalent
$(document).ready(function() {

    // setup the size slider first
    $('#sizeslider').slider({
        range: "min",
        value: 4,
        min: 2,
        max: 10,
        slide: function (event, ui) {
            $('#sizeslider-val').html(ui.value);
        },
        stop: function (event, ui) {
            Maps.loadOccurrencesByType($('#colourFacets').val());
        }
    });

    //Maps.loadMap();
    Maps.initialise();
    Maps.loadOccurrencesByType("");

    // live event for toggling layer views
    $('input.layer').live("click", function(){
        Maps.toggleOccurrenceLayer(this);
    });

    // live event for loading up fancybox styles
    $('a.iframe').live("mouseover click", function(){
        //initialise fancy box
        $("a.fancy_iframe").fancybox({
            'showCloseButton': true,
            'titleShow' : false,
            'autoDimensions' : false,
            'hideOnContentClick' : false,
            'hideOnOverlayClick': true,
            'width' : '85%',
            'height' : '85%',
            'autoScale' : false,
            'type' : 'iframe'
        });

        return false; 
    });



    // event for when a colourby facet is selected
    $('#colourFacets').change(function(){
        Maps.loadOccurrencesByType($('#colourFacets').val());
    });

    $('#envLyrList').change(function(){
        Maps.loadEnvironmentalLayer(parseInt($(this).val()));
    });

    // event for toggling the legend
    $("#legend div.title, #legend div:first").click(function() {
        $('#layerlist').toggle();
    });

    // event for toggle all layers
    $('#toggleAll').click(function(){
        $('input.layer').each(function(index) {
            $(this).attr('checked', ($(this).is(':checked'))?false:true);
            Maps.toggleOccurrenceLayer(this);
        });

    });

}); // end JQuery document ready

