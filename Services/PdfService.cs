using System.Text;
using UglyToad.PdfPig;

namespace AskMyPDF.Services;

public class PdfService
{
    public string ExtractText(Stream stream)
    {
        using var pdf = PdfDocument.Open(stream);
        var sb = new StringBuilder();
        foreach (var page in pdf.GetPages())
        {
            var words = page.GetWords().Select(w => w.Text);
            sb.AppendLine(string.Join(" ", words));
        }
        return sb.ToString();
    }
}
