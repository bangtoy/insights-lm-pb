import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    console.log('Knowledge file processing callback received:', payload);

    const { file_id, content, chunks, title, status, error } = payload

    if (!file_id) {
      return new Response(
        JSON.stringify({ error: 'file_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (status === 'failed' || error) {
      // Update file status to failed
      await supabaseClient
        .from('knowledge_files')
        .update({ 
          processing_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', file_id)

      console.error('Knowledge file processing failed:', error)
      return new Response(
        JSON.stringify({ success: true, message: 'File marked as failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update file record
    const updateData: any = {
      processing_status: 'completed',
      updated_at: new Date().toISOString()
    }

    if (title) {
      updateData.title = title
    }

    const { error: updateError } = await supabaseClient
      .from('knowledge_files')
      .update(updateData)
      .eq('id', file_id)

    if (updateError) {
      console.error('Error updating knowledge file:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update file', details: updateError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert chunks if provided
    if (chunks && Array.isArray(chunks) && chunks.length > 0) {
      const chunkData = chunks.map((chunk: any, index: number) => ({
        file_id: file_id,
        content: chunk.content || chunk,
        chunk_index: index,
        metadata: chunk.metadata || {}
      }))

      const { error: chunksError } = await supabaseClient
        .from('file_chunks')
        .insert(chunkData)

      if (chunksError) {
        console.error('Error inserting chunks:', chunksError)
        // Don't fail the whole operation, just log the error
      } else {
        console.log(`Inserted ${chunks.length} chunks for file ${file_id}`)
      }
    }

    console.log('Knowledge file processing completed successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Knowledge file processed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in process-knowledge-file-callback function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})