from rest_framework.pagination import PageNumberPagination

class OptionalPageNumberPagination(PageNumberPagination):
    """
    Pagination class that only paginates if 'page' query param is present.
    If 'page' is not provided, returns full list for backwards compatibility.
    """
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200

    def paginate_queryset(self, queryset, request, view=None):
        if 'page' not in request.query_params:
            return None
        return super().paginate_queryset(queryset, request, view)
