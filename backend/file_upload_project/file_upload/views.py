from django.shortcuts import render, redirect
from django.http import HttpResponse
from .models import UploadedFile
from .forms import fileUploadForm
from .utils import process_resume
import os


def upload_file(request):
    if request.method == "POST":
        form = fileUploadForm(request.POST, request.FILES)
        if form.is_valid():
            uploaded_file = form.save(commit=False)
            uploaded_file.save()

            # Process the file after saving
            try:
                print("Begin.")
                processed_content = process_resume(f'{uploaded_file.file_path()}')
                print("Finished.")
                uploaded_file.processed_content = str(processed_content) 
                uploaded_file.save()
            except Exception as e:
                # Handle processing errors
                print(f"Error processing file: {str(e)}")

            return redirect("display_file", file_id=uploaded_file.id)
    else:
        form = fileUploadForm()

    return render(request, "file_upload/upload.html", {"form": form})


def display_file(request, file_id):
    try:
        file_obj = UploadedFile.objects.get(pk=file_id)
        file_path = file_obj.file.path

        return render(
            request,
            "file_upload/display.html",
            {
                "filename": os.path.basename(file_path),
                "content": "The resume was processed successfully.",
                "processed_content": file_obj.processed_content,
            },
        )
    except Exception as e:
        return HttpResponse(f"Error: {str(e)}")


def file_list(request):
    files = UploadedFile.objects.all().order_by("-uploaded_at")
    return render(request, "file_upload/list.html", {"files": files})
