<?php
   /* One-time script to write inverted index for Pokedex.
	  Output should be file with format:
	  {
		<pokemon_name>: <national_id>,
		...
	  }
   */
	ini_set('display_errors', 'On');

 	$pokedex = $_POST['pokedex'];
   	
	$pokedex = (array) json_decode($pokedex);

 	$invertedIndex = array();
 	foreach ($pokedex as $pokemon) {
 		$invertedIndex[$pokemon->name] = 0 + substr(($pokemon->resource_uri),15,-1);
 	}

 	if ($invertedIndex != null) { /* sanity check */
 	  $file = fopen('InvertedIndexPokedex.json','w') or die("can't open file");
    $json = json_encode($invertedIndex);
    //echo json_encode($invertedIndex);
    fwrite($file, $json);
    fclose($file);
 	} else {
   // handle error 
 	}

?>