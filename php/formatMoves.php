<?php 
// Function to reformat pokemon move list to be in
// separate (sorted) lists according to learn_type

$pokemon = json_decode($_POST["pokemon"]);

$move_list = $pokemon['moves'];

?>