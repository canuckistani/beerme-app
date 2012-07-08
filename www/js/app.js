require.config({
    paths: {'jquery':
            ['//ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min',
             'lib/jquery']}
    , baseUrl: '/js/lib'
});

require(['jquery','jqmobile/jquery.mobile-1.1.0'], function($) {

    var pp = function(o) { return JSON.stringify(o,null,'  ')}, 
    L = console.log;
    var beerme = {};
    beerme._dbcache = [];
    beerme._brewer_cache = null;

    function _sort_by_key(data, sort_key) {

        function key_sort(a,b) {
            if (a[sort_key] === b[sort_key]) { return 0; }
            if (a[sort_key] > b[sort_key]) { return 1; }
            return -1;
        };

        return data.sort(key_sort);
    }

    function _filter_style(data, style /* ='all' */) {
        if (!style) style = 'all';
        return data.filter(function(beer, i, arr) {
            if (beer.general_style === style) {
                return beer;
            }
        });
    }

    function _filter_brewer(data, brewer) {
        return data.filter(function(beer, i, arr) {
            if (beer.brewer === brewer) {
                return beer;
            }
        });
    }

    function _get_keys(data, keys /* =Array*/) {
        return data.map(function(beer) {
            var out = {};
            for (var i = keys.length - 1; i >= 0; i--) {
                out[keys[i]] = beer[keys[i]];
            };
            return out;
        })
    }

    function _get_category_vals(key /* eg brewer, style, etc */ , data) {
        var unique = {};
        for (i in data) {
            if (unique[data[i][key]]) {
                unique[data[i][key]++];
            }
            else {
                unique[data[i][key]] = 0;
            }
        }
        return Object.keys(unique).sort();
    }

    function sortByRemaining(data) {
        return _sort_by_key(data, 'remaining').reverse();
    }

    function getStyles(data) {
        return _get_category_vals('general_style', data);
    }

    function getBrewers(data) {
        return _get_category_vals('brewer', data);
    }

    function r(n) {
        return Math.round((n*100) / 100);
    }

    // L(pp(_get_keys(_sort_ales_by_brewer(data), ['name', 'brewer', 'general_style', 'specific_style'])));

    function initLists(data, current) {
        var styles = getStyles(data);
        var s_styles; for (i in styles) {
            var selected = '';
            if (styles[i] === current) {
                selected = ' selected';
            }
            s_styles += '<option'+selected+'>'+styles[i]+'</option>';
        }
        $('#styles').append(s_styles);

        // var brewers = getBrewers(data);
        // var s_brewers; for (i in brewers) {
        //  s_brewers += '<option>'+brewers[i]+'</option>';
        // }
        // $('#brewers').append(s_brewers);
        $('#busy').html('&nbsp;');
    }

    function displayBeers(data) {

        data = _sort_by_key(data, 'remaining');

        var s = '<ul>';
        for (var i = data.length - 1; i >= 0; i--) {
            var beer = data[i];
            s += '<li class="beer-list-item"><div class="name">'+ beer.name + '</div>'
                +'<div class="pct">'+ r(beer.remaining) +'%</div>'
                +'</li>';
        };

        $('#beers').html(s+'</ul>');
    }

    // var DEBUG=true;
    var DEBUG=false;

    var beerCache = [], url = false;

    DEBUG ? url = 'http://localhost:8000/server/debug.json' : url = 'http://live-menu.staugustinesvancouver.com/taps.json?offset=0&amount=9999&callback=?';

    function brewerListGen() {
        var list = getBrewers(beerme._dbcache);

        return list.map(function(item) { 
            var beer = sortByRemaining(_filter_brewer(beerme._dbcache, item)).map(function(beer) {
                return _formatItem(beer);
            }).join("\n");
            return '<li><a href="#'+item+'">'+ item +'</a>'
            +'<ul>' + 
                beer
             + '</ul>'
            +'</li>';
        }).join("\n");
    }

    function styleListGen() {
        var list = getStyles(beerme._dbcache);
        return list.map(function(item) { 
            return '<li><a href="#'+item+'">'+ item +'</a>'+
                '<ul>' +
                sortByRemaining(_filter_style(beerme._dbcache, item))
                    .map(function(item) {
                        return _formatItem(item);
                    }).join("\n")
                + '</ul>'
            +'</li>';
        }).join("\n");
    }

    function fetch() {
        beerme._brewer_cache = null;
        $.getJSON(url, function (response) {
            beerme._dbcache = response;
            // pre-generate the 
            window.setTimeout(function() {
                beerme._brewer_cache = brewerListGen();
            }, 400);
            window.setTimeout(function() {
                beerme._style_cache = styleListGen();
            }, 0);
        });
    }

    var global = this;

    var pp = function(o) { return JSON.stringify(o,null,'  ')};

    var L = console.log;

    function _formatItem(item) {
        return '<li>'+ item.name + '<span class="ui-li-count">'+ r(item.remaining) +'</span></li>';
    }

    $(document).bind('pageinit', function() {

        $(document).delegate("#all", "pageinit", function() {
            var sorted = sortByRemaining(beerme._dbcache);
            var items = beerme._dbcache.map(function(item) {
                return _formatItem(item);
            }).join("\n");

            $('#all-beers').html(items).listview('refresh');
        });

        $(document).delegate("#styles", "pageinit", function() {
            if (!beerme._style_cache) {
                beerme._style_cache = styleListGen();
            }
            $('#style-list').html(beerme._style_cache).listview('refresh');
            
        });

        // maybe not have the additional level here...
        $(document).delegate("#brewers", "pageinit", function() {
            if (!beerme._brewer_cache) {
                beerme._brewer_cache = brewerListGen();
            }
            $('#brewer-list').html(beerme._brewer_cache).listview('refresh');
        });
    });

    $(function() {
        fetch();
    });
});