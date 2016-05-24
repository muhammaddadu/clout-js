/**
 * EatHomely
 */
var $doc = $(document);

/**
 * Methods
 */
function enableTextillate() {
	$('.tlt').textillate({
		selector: '.texts',
	    minDisplayTime: 5000,
	    initialDelay: 0,
	    in: { delay: 50, effect: 'fadeInLeftBig', sync: false }, 
	    out :{ delay: 30, effect: 'fadeOutRightBig', sync: false },
	    loop: false
	});
}
