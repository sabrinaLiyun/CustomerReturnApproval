/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"SAPUI5MyReturnOrder/CustomerReturnApproval/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});