<?php
/*
Plugin Name: RSS Lightbox for Wordpress 2.3
Plugin URI: http://www.cyberfanatix.com/tbogard/wp_rss_lightbox/
Feed URI:
Description: take a RSS from Photobucket album and display a lightbox with their pictures. Based in LightBox 2 from Kjell Bublitz.<br>Using Lightbox v2.03.3 and compressed Prototype Javascript. 
Version: 0.1
Author: Erick Rodriguez
Author URI: http://www.cyberfanatix.com/tbogard/
*/

/*******************************************************************
*	DON'T EDIT BELOW THIS LINE UNLESS YOU KNOW WHAT YOU ARE DOING
*******************************************************************/

	// for version control and installation
	global $wpdb;
	define('RSS_LIGHTBOX_VERSION', '0.1/2.03.3');
	
	// detect the plugin path
	$rss_lightbox_path = get_settings('siteurl').'/wp-content/plugins/rss_lightbox';
	
	// try to always get the values from the database, or setup the default values
	$rss_exist_query = $wpdb->query('select * from '.$wpdb->options.' where option_name="RSS_LIGHTBOX_VERSION"');
	if($rss_exist_query==0){
		update_option('RSS_LIGHTBOX_ENABLE',"1");
		update_option('RSS_LIGHTBOX_VERSION',RSS_LIGHTBOX_VERSION);
		update_option('enable_rss_compatibility', 0);
	}
	$enable_rss_compatibility=get_option('enable_rss_compatibility');
	$RSS_LIGHTBOX_VERSION=get_option('RSS_LIGHTBOX_VERSION');
	 	
	/**
	 * Creates the necessary HTML for the wp_head() action. 
	 * 
	 * @package Lightbox Plugin
	 */
     function rss_lightbox_header()
     {
     	global $rss_lightbox_path, $enable_rss_compatibility ,$RSS_LIGHTBOX_VERSION;

		// prepare header and print
		$rsslightboxHead = "<!-- RSS Lightbox Plugin {$RSS_LIGHTBOX_VERSION}  -->\n"
		."\n<link rel=\"stylesheet\" href=\"{$rss_lightbox_path}/css/rss_lightbox2.css\" type=\"text/css\" media=\"screen\" />\n"
		."\n<style>\n"
		."\t#rss_prevLink:hover, #rss_prevLink:visited:hover { background: url({$rss_lightbox_path}/images/prev.gif) no-repeat; }\n"
		."\t#rss_nextLink:hover, #rss_nextLink:visited:hover { background: url({$rss_lightbox_path}/images/next.gif) no-repeat; }\n"
		."</style>\n"
		."<script type=\"text/javascript\">\n"
        ."\tvar _rss_loader='';\n"
		."\tvar _rss_data='';\n"
		."\tvar rss_fileNext='{$rss_lightbox_path}/images/next.gif';\n"
		."\tvar rss_filePrev='{$rss_lightbox_path}/images/prev.gif';\n"
		."\tvar rss_fileBottomNavCloseImage='{$rss_lightbox_path}/images/close.gif';\n"
		."\tvar rss_fileLoadingImage='{$rss_lightbox_path}/images/loading.gif';\n"
		."\tvar jsonservice='{$rss_lightbox_path}/lib/wp-rsslightboxreader.php';\n"
		."\tvar rss_loadingmsg='{$rss_lightbox_path}/images/ajax-loader.gif';\n"
        ."</script>\n";
		
		if($enable_rss_compatibility==0){
			$rsslightboxHead.="<script type=\"text/javascript\" src=\"{$rss_lightbox_path}/js/prototype.js\"></script>\n"
							."<script type=\"text/javascript\" src=\"{$rss_lightbox_path}/js/effects.js\"></script>\n";
		}
		$rsslightboxHead.="<script type=\"text/javascript\" src=\"{$rss_lightbox_path}/js/rss_lightbox2.js\"></script>\n\t<!-- /RSS Lightbox Plugin -->\n";
		
		print($rsslightboxHead);
     }
	 
		

	

	/**
	 * Creates the Option Page
	 * 
	 * @package Lightbox Plugin
	 * @see rss_lightbox_options()
	 */
	function rss_lightbox_pages() {
	    //add_options_page('RSS Lightbox Options', 'RSS Lightbox Options', 5, 'rss_lightboxoptions', 'rss_lightbox_options');
		add_options_page('RSS Lightbox Options', 'RSS Lightbox Options', 5, 'rss_lightbox_options', 'rss_lightbox_options');
	}

	/**
	 * Outputs the HTML for the options page
	 * 
	 * @package Lightbox Plugin
	 * @see rss_lightbox_pages()
	 */
	function rss_lightbox_options() 
	{
     	global $rss_lightbox_path, $enable_rss_compatibility, $RSS_LIGHTBOX_VERSION, $rss_lightbox_options, $rss_exist_query;
 
     	// if settings are updated
		if(isset($_POST['update_rss_lightbox'])) 
		{
			if(is_numeric($_POST['enable_rss_compatibility'])) {
				update_option('enable_rss_compatibility', $_POST['enable_rss_compatibility']);
				$enable_rss_compatibility = $_POST['enable_rss_compatibility'];
			}
		}
		
		// if the user clicks the uninstall button, clean all options and show good-bye message
		if(isset($_POST['uninstall_rss_lightbox'])) 
		{
			delete_option(enable_rss_compatibility);
			delete_option(RSS_LIGHTBOX_VERSION);
			delete_option(RSS_LIGHTBOX_ENABLE);
			
			echo '<div class="wrap"><h2>Good Bye!</h2><p>All rss lightbox settings were removed and you can now go to the <a href="plugins.php">plugin menu</a> and deactivate it.</p><h3>Thank you for using Lightbox '.$RSS_LIGHTBOX_VERSION.'!</h3><p style="text-align:right"><small>if this happend by accident, <a href="options-general.php?page=rss_lightboxoptions">click here</a> to reinstall</small></p></div>';
						
		} 
		else // show the menu
		{
			
			echo '<div class="wrap">'
			.'<div><H2>How it works?</H2> Just add the rss url from your photobucket gallery like this:</div>'
			.'<div><small>&lt;a href=&quot;javascript:void(0)&quot;<br />'
			."onclick=&quot;startRssLightbox('http://rss_server.photobucket.com/albums/user_number/my_photobucket_user/album_name/feed.rss','photobucket'); return false&quot;&gt;<br />"
			.'the link to your gallery<br />'
			.'&lt;/a&gt; </small></div>'
			.'<div>And this is all!</div><br /><br />'
			.'<h2>RSS Lightbox Options</h2><div><small style="display:block;text-align:right">Version: '.$RSS_LIGHTBOX_VERSION.'</small></div>'
			.'<form method="post" action="options-general.php?page=rss_lightbox_options">'
			.'<input name="update_rss_lightbox" type="hidden" id="update_rss_lightbox" value="true" />'
			.'<table class="optiontable"><tr valign="top">'
			.'<th scope="row">Enable Compatibility with LightBox 2.0 for wordpress</th>'
			.'<td><div>If You have Lightbox 2.0 for wordpress and is enable, select &quot;Yes&quot;, otherwise select &quot;No&quot;</div><div>'
			.'<select name="enable_rss_compatibility" id="enable_rss_compatibility">'
			.'<option value="1"';
			if($enable_rss_compatibility==1){
				echo ' selected';
			}
			
			echo '>Yes</option>'
			.'<option value="0"';
			
			if($enable_rss_compatibility==0){
				echo ' selected';
			}
			echo '>No</option>'
			.'</select></div></td>'
			.'</tr></table>'
			.'<p class="submit"><input type="submit" name="Submit" value="Update Options &raquo;" /></p>'
			.'</form>';
			
			//donate
			
			echo '<h2>Support</h2><table width="100%" border="0" cellspacing="2" cellpadding="0">'
.'<tr>'
.'<td width="50%" valign="top">'
.'<h3>Release Notes <strong>Ver 0.1</strong> :</h3>'
.'<ul>'
.'<li> Hack of the original Lightbox 2.03.3 to show a nice panel of navigation into the lightbox.</li>'
.'<li>Friendly compatible with other lightbox versions for wordpress.</li>'
.'<li>Support Photobucket RSS to bring photos from a specific album.</li>'
.'<li>Support Error Handle while connects RSS service (403, 404, timeout event)</li>'
.'</ul>'
.'<h3>Box Wishes:</h3>'
.'<ul>'
.'<li>it will support also Flickr in a near future.</li>'
.'<li>It will display thumbnails in the navigation bar.</li>'
.'</ul>'
.'<p>I&#8217;m glad to answer your questions in this mail : tb[dot]erick[dot]rodriguez[at]gmail[dot]com, or enter <a href="http://www.cyberfanatix.com/tbogard/rss_lightbox-plugin-for-wordpress/" target="_blank">Here</a></p>'
.'</td>'
.'<td width="50%" valign="top">'
.'<div>'
.'<h4>Can You help me?</h4>'
.'</p></div>'
.'<div align="justify">'
.'<p>I&#8217;m student of Master in Religious Education in the <a href="http://www.uts.edu" target="_blank">Unification Theological Seminary</a> and this is a great experience for my life. </p>'
.'<p align="center"><img src="'.$rss_lightbox_path.'/images/i_want_this_pc.jpg" width="234" height="173" /></p>'
.'<p>I want to buy a HP Pavilion DV9500z to do my homeworks and also make this plugin better and confortable for you. 5$ don&#8217;t kill nothing, and 10$ may be. If you like this plugin to show a lightbox gallery for pictures from <strong>photobucket</strong> in your blog, please donate!!! I really appreciate your help!!!</p>'
.'</p></div>'
.'<div>'
.'<div align="center">'
.'<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank">'
.'<input type="hidden" name="cmd" value="_s-xclick">'
.'<input type="image" src="http://www.cyberfanatix.com/tbogard/donate.jpg" border="0" name="submit" alt="Realice pagos con PayPal: es rapido, gratis y seguro.">'
.'<img alt="" border="0" src="https://www.paypal.com/es_XC/i/scr/pixel.gif" width="1" height="1">'
.'<input type="hidden" name="encrypted" value="-----BEGIN PKCS7-----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-----END PKCS7-----
">'
.'</form>'
.'</div></div></td>'
.'</tr>'
.'</table>';
			
			//unninstall
			
			
			
			echo '<h2>Uninstall</h2><form method="post" action="options-general.php?page=rss_lightbox_options">';
			echo '<input type="hidden" name="uninstall_rss_lightbox" value="true" />';
			echo '<p class="submit"><input type="submit" name="Submit" value="Clear Settings &raquo;" /></p>';		
			echo '</form>';
			
			
			echo '<p>The plugin assumes all files are installed at:<br />'.$rss_lightbox_path.'/</p></div>';
			
		}
	}
/*******************************************************************
*	LINK THE FUNCTIONS TO THE FILTERS AND ACTIONS
*******************************************************************/	
	
// add the options page to admin menu
	add_action('admin_menu', 'rss_lightbox_pages');
	
// add lightbox header to theme
	add_action('wp_head', 'rss_lightbox_header');
?>