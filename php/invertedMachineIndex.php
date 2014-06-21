<?php
   /* One-time script to write inverted index for TM/HM List
	  Output should be file with format:
	  {
		<move_name>: <machine_ID>,
		...
	  }
   */
	ini_set('display_errors', 'On');

 	$machines = $_POST['machines'];
   	
	$machines = (array) json_decode($machines);

 	$invertedIndex = array();
 	foreach ($machines as $machine_ID => $move) {
 		$invertedIndex[strtolower($move)] = $machine_ID;
 	}

 	if ($invertedIndex != null) { /* sanity check */
 	  $file = fopen('../js/InvertedMachineIndex.json','w') or die("can't open file");
    $json = json_encode($invertedIndex);
    //echo json_encode($invertedIndex);
    fwrite($file, $json);
    fclose($file);
    return $json;
 	} else {
    return "Inverted Index was null!"; 
 	}

?>