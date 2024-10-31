<?php
# FileName="Connection_php_mysql.htm"
# Type="MYSQL"
# HTTP="true"
$hostname_wp_rss_db = "localhost"; // 99% chance you won't need to change this value
$database_wp_rss_db = ""; // The name of the database
$username_wp_rss_db = ""; // Your MySQL username
$password_wp_rss_db = ""; //...and password

// You can have multiple installations in one database if you give each a unique prefix
$wp_prefix="wp_";   // Only numbers, letters, and underscores please!


$wp_rss_db = mysql_pconnect($hostname_wp_rss_db, $username_wp_rss_db, $password_wp_rss_db) or trigger_error(mysql_error(),E_USER_ERROR); 
?>