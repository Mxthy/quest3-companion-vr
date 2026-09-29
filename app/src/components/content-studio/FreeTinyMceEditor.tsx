import { Editor } from "@tinymce/tinymce-react";

const API_KEY = "6pqazq8u2k8vgsrwspjrfgpq1lpqvw43pusfwqb1ru6h9qcq";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function FreeTinyMceEditor({ value, onChange }: Props) {
  return (
    <Editor
      apiKey={API_KEY}
      value={value}
      onEditorChange={onChange}
      init={{
        height: 330,
        menubar: false,
        branding: false,
        plugins: [
          "accordion",
          "advlist",
          "anchor",
          "autolink",
          "autoresize",
          "autosave",
          "charmap",
          "code",
          "codesample",
          "directionality",
          "emoticons",
          "fullscreen",
          "help",
          "image",
          "importcss",
          "insertdatetime",
          "link",
          "lists",
          "media",
          "nonbreaking",
          "pagebreak",
          "preview",
          "quickbars",
          "save",
          "searchreplace",
          "table",
          "visualblocks",
          "visualchars",
          "wordcount",
        ],
        toolbar:
          "undo redo | blocks | bold italic underline | " +
          "alignleft aligncenter alignright | bullist numlist | " +
          "link image table | code fullscreen | removeformat",
        quickbars_selection_toolbar: "bold italic | quicklink blockquote",
        content_style:
          "body { font-family: system-ui, sans-serif; font-size: 16px; line-height: 1.6; }",
      }}
    />
  );
}
