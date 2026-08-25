sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
    "use strict";

    return UIComponent.extend("travel.tracker.employee.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
            this.getRouter().initialize();

            // App state model
            var oAppModel = new JSONModel({
                currentEmployee: null,
                employeeId: "e003" // Default employee for demo
            });
            this.setModel(oAppModel, "app");
        }
    });
});
