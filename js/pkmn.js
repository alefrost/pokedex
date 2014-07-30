function SearchPokemon() {
    var name = $('#PokeSearch').val();
    if (name == null || name == "") {
        return false;
    }
    window.location.href = "/pokedex/pages/display_pokemon.html?pkmn="+name;
}

/* Renders pokemon of the given ID
    PARAMS:
    - int <id>: national_id of Pokemon
    - string <renderId>: ID of html div to render template inside of
*/
function getPokemonById(id, renderId)
{
	$.ajax({
        url: 'http://127.0.0.1:5984/pokedex_dev01/pokemon-'+ id + '/',
        dataType: 'json',
        success: function(pokemon){
            var img = '/pokedex/images/'+('000' + id).substr(-3)+'.png';
            pokemon["image_src"] = img;
            pokemon["forms"] = getForms(pokemon.name);
            getDescriptions(pokemon["descriptions"]);
            formatMoves(pokemon);

            $.get('/pokedex/templates/pokemon.mustache', function(template) {
                // fetch forms partial
                $.get('/pokedex/templates/forms.mustache', function(partial) {
                    var html = Mustache.to_html(template, pokemon, {'forms': partial});
                    $('#'+renderId).html(html);
                })
            });
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert(JSON.stringify(jqXHR) + ":\n" + textStatus);
        }
    });
}

/* Renders pokemon of the given name
    PARAMS:
    - string <name>: Name of Pokemon
    - string <renderId>: ID of html div to render template inside of
*/
function getPokemonByName(name, renderId)
{
    $.ajax({
        dataType: 'json',
        url: '/pokedex/js/InvertedIndexPokedex.json',
        success: function(invertedPokedex) {
            var id = JSON.stringify(invertedPokedex[name.toLowerCase()]);
            if (id) {
                getPokemonById(id, renderId);
            } else {
                getPokemonById(name, renderId);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert(errorThrown + ":\n" + textStatus);
        }
    });
}

function getForms(name, type) {
    var forms = false;
    $.ajax({
        url: 'http://127.0.0.1:5984/pokedex_dev01/_design/pokemon/_view/formsAndMegas', 
        dataType: 'json',
        async: false,
        success: function(formList) {
            forms = [];
            for(var i=0;i<formList['rows'].length;i++) {
                if(formList.rows[i].key.indexOf(name) > -1) {
                    forms.push(formList.rows[i].value);
                }
            }
        }
    });
    if (forms.length > 0)
        return forms;
    return false;
}

function getMoveDetails(move_details) {
    $.ajax({
        url: 'http://127.0.0.1:5984/pokedex_dev01/move-' + move_details["resource_uri"].slice(13,-1),
        async: false,
        dataType: 'json',
        success: function(move) {
            move_details["description"] = move["description"];
            move_details["power"] = move["power"];
            move_details["accuracy"] = move["accuracy"];
            move_details["category"] = move["category"];
            move_details["pp"] = move["pp"];
        }
    })
    return move_details;
}

function formatMoves(pokemon) {
    moves = {
        'levelup': [],
        'machine': [],
        'egg_move': [],
        'tutor': [],
        'other': [],
    };

    // Load in inverted index of TM/HM moves
    var machines;
    $.ajax({
        dataType: 'json',
        url: '/pokedex/js/InvertedMachineIndex.json',
        async: false,
        success: function(invertedMachines) {
            machines = invertedMachines;
        }
    })

    // filter moves into categories via learn type
    var mach_id;
    var move;
    for(var i=0; i < pokemon.moves.length; i++) {
        switch(pokemon.moves[i].learn_type) {
            case 'level up':
                moves.levelup.push(pokemon.moves[i]);
                break;
            case 'machine':
                mach_id = machines[pokemon.moves[i]["name"].toLowerCase()];
                move = pokemon.moves[i];
                if (mach_id != "" && mach_id != null) {
                    move["mach_id"] = mach_id;
                    moves.machine.push(move);
                } else {
                    // handle old TM/HM moves prior to gen 6
                    moves.other.push(move);
                }
                move = "";
                break;
            case 'egg move':
                moves.egg_move.push(pokemon.moves[i]);
                break;
            case 'tutor':
                moves.tutor.push(pokemon.moves[i]);
                break;
            default:
                // this may never happen... unsure
                moves.other.push(pokemon.moves[i]);
        }
    }

    // sort lvl-up moves by ascending level
    moves.levelup.sort(function(a, b) {
        return a.level - b.level;
    });

    moves.machine.sort(function(a, b) {
        var aMachType = a.mach_id.slice(0,2);
        var bMachType = b.mach_id.slice(0,2);
        if (aMachType == bMachType) { 
            var aid = parseInt(a.mach_id.slice(2));
            var bid = parseInt(b.mach_id.slice(2));
            //alert(a.mach_id + " =?= " + b.mach_id);
            return aid - bid;
        } else {
            if (aMachType < bMachType){
                return 1;
            } else {
                return -1;
            }
        }
    });
    moves.tutor.sort(function(a, b) {
        return a.name > b.name;
    })
    moves.egg_move.sort(function(a, b) {
        return a.name > b.name;
    });
    moves.other.sort(function(a, b) {
        return a.name > b.name;
    });
    moves.levelup = moves.levelup.map(getMoveDetails);
    moves.machine = moves.machine.map(getMoveDetails);
    moves.egg_move = moves.egg_move.map(getMoveDetails);
    moves.tutor = moves.tutor.map(getMoveDetails);
    moves.other = moves.other.map(getMoveDetails);
    // replace original moves list with formatted structure
    pokemon["moves"] = [moves];
}

function getDescriptions(descriptions) {
    for (var i=0;i<descriptions.length;i++) {
        $.ajax({
            url: 'http://127.0.0.1:5984/pokedex_dev01/description-'+descriptions[i]["resource_uri"].slice(20,-1),
            async: false,
            dataType: 'json',
            success: function (d) {
                descriptions[i]["description"] = d["description"];
                descriptions[i]["games"] = d["games"];
            }
        });
    }
    descriptions.sort(function(a, b) {
        return a.id > b.id;
    });
}


function pokedex_sort(a, b) {
    // slice(15,-1) obtains national dex ID from resource uri.
    // this keeps from having to do another API call just for ID, although, one might happen anyway...
    var aid = parseInt(a.resource_uri.slice(15,-1), 10);
    var bid = parseInt(b.resource_uri.slice(15,-1), 10);
    return aid - bid;
}
function displayDexRow(pkmn, renderID) {
    $.ajax({
        url: '/pokedex/templates/pokedex.mustache',
        success: function(template) {
            var html = Mustache.to_html(template, pkmn);
            $('#'+pkmn.national_id +'-pkmn').html(html);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert(JSON.stringify(jqXHR) + ":\n" + textStatus);
        }
    });
}
function displayPokedex(renderID) {
    $.ajax({
        url: 'http://127.0.0.1:5984/pokedex_dev01/_design/pokemon/_view/base',
        dataType: 'json',
        success: function(view){
            var limit = view.rows.length;
            for(var i=0;i<limit;i++){
                ///var pkmn = view.rows[i].value;
                $('#'+renderID).append('<tr id="'+view.rows[i].value.national_id+'-pkmn"></tr>');
                displayDexRow(view.rows[i].value, renderID);
                
            }
        }
    });
}

function typechart(renderID) {
    $.ajax({
        url: 'http://127.0.0.1:5984/pokedex_dev01/_design/types/_view/all',
        dataType: 'json',
        success: function(view){
            var limit = view.rows.length;
            var chart = {"header": view.rows.map(function(t){return t.name;})};
            alert(JSON.stringify(header));
            /*for(var i=0;i<limit;i++){
                ///var pkmn = view.rows[i].value;
                $('#'+renderID).append('<tr id="'+view.rows[i].value.national_id+'-pkmn"></tr>');
                displayDexRow(view.rows[i].value, renderID);
                
            }*/
        }
    });
}

/* ------------------ One-Time-Execution functions go below here ------------------ */
// generate inverted index for pokedex.
//   pokemon name => id
function writeInvertedPokedex()
{
    $.ajax({
            url: 'http://pokeapi.co/api/v1/pokedex/1/',
            dataType: 'jsonp',
            success: function(pokedex){
                $.post('invertedPokedex.php', {"pokedex": JSON.stringify(pokedex.pokemon)}, 
                    function(data, status){
                        $('#result').html(JSON.stringify(data));
                    });
            },
            error: function(jqXHR, textStatus, errorThrown) {
                alert(errorThrown + ":\n" + textStatus);
            }
        });
}

//generate inverted index for TM/HM list
//   move => (TM|HM)number
function writeInvertedMachineIndex()
{
    $.ajax({
        dataType: 'json',
        url: '/pokedex/js/machineIndexHyphonated.json',
        success: function(machines) {
            $.post('/pokedex/php/invertedMachineIndex.php', {"machines": JSON.stringify(machines)},
                function(data, status) {
                    $('#result').html("STATUS:<br />"+status + "<br />DATA:<br />" + JSON.stringify(data));
                });
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert(errorThrown + ":\n" + textStatus);
        }
    });
}
