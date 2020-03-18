sap.ui.define([
	"sap/m/StandardListItemRenderer"
], function (SLIR) {
	"use strict";

	return SLIR.extend("approve.req.vendor.codan.control.ListItemWithColorIcon", {

		renderLIContent: function (r, l) {
			var i = l.getInfo(),
				I = l.getInfoTextDirection(),
				t = l.getTitleTextDirection(),
				d = l.getTitle() && (l.getDescription() || !l.getAdaptTitleSize()),
				ai = l.getAdditionalInfo();

			if (!ai) {
				SLIR.renderLIContent.apply(this, arguments);
				return;
			}

			if (l.getIcon()) {
				r.renderControl(l._getImage());
			}
			if (d) {
				r.write('<div class="sapMSLIDiv">');
			}
			r.write('<div');
			if (!d) {
				r.addClass('sapMSLIDiv');
			}
			r.addClass('sapMSLITitleDiv');
			r.writeClasses();
			r.write('>');
			r.write('<div');
			r.addClass(d ? 'sapMSLITitle' : 'sapMSLITitleOnly');
			r.writeClasses();
			if (t !== sap.ui.core.TextDirection.Inherit) {
				r.writeAttribute('dir', t.toLowerCase());
			}
			r.write('>');
			r.writeEscaped(l.getTitle());
			r.write('</div>');
			if (i && !d) {
				r.write('<div');
				r.writeAttribute('id', l.getId() + '-info');
				r.addClass('sapMSLIInfo');
				r.addClass('sapMSLIInfo' + l.getInfoState());
				r.writeClasses();
				if (I !== sap.ui.core.TextDirection.Inherit) {
					r.writeAttribute('dir', I.toLowerCase());
				}
				r.write('>');
				r.writeEscaped(i);
				r.write('</div>');
			}
			r.write('</div>');
			r.write('<div class="sapMSLIDescriptionDiv">');
			if (d) {
				r.write('<div class="sapMSLIDescription">');
				if (l.getDescription()) {
					r.writeEscaped(l.getDescription());
				} else {
					r.write('&nbsp;');
				}
				r.write('</div>');
			}
			if (ai) {
				if (d) {
					r.write("</div>");
				}
				r.write('<div class="sapMSLIDescriptionDiv">');
				r.write('<div class="sapMSLIDescription">');
				r.writeEscaped(ai);
				if (!d) {
					r.write("</div>");
				}
			}
			if (i && d) {
				r.write('<div');
				r.writeAttribute('id', l.getId() + '-info');
				r.addClass('sapMSLIInfo');
				r.addClass('sapMSLIInfo' + l.getInfoState());
				r.writeClasses();
				if (I !== sap.ui.core.TextDirection.Inherit) {
					r.writeAttribute('dir', I.toLowerCase());
				}
				r.write('>');
				r.writeEscaped(i);
				r.write('</div>');
			}
			r.write('</div>');
			if (d) {
				r.write('</div>');
			}
		}
	});
});